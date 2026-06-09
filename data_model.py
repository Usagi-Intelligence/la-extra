"""
Data model for La Extra order management system.
Extracted from main.py — handles all data I/O, queries, and business logic.
All identified bugs are fixed in this module.
"""
import json
import os
import sys
import re
from datetime import datetime
from collections import defaultdict


# ── Paths ─────────────────────────────────────────────────────────────────────

def _get_app_dir():
    if getattr(sys, "frozen", False):
        app_data = os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))
        folder = os.path.join(app_data, "SistemaLaExtra")
        os.makedirs(folder, exist_ok=True)
        
        # Ensure initial data.json is copied if not present
        target_file = os.path.join(folder, "data.json")
        if not os.path.exists(target_file):
            # 1. Try to copy from executable directory (adjacent files)
            exe_dir = os.path.dirname(sys.executable)
            source_file = os.path.join(exe_dir, "data.json")
            if os.path.exists(source_file):
                import shutil
                try:
                    shutil.copy2(source_file, target_file)
                except Exception:
                    pass
            else:
                # 2. Try to copy from bundled MEIPASS directory
                meipass = getattr(sys, "_MEIPASS", None)
                if meipass:
                    bundled_file = os.path.join(meipass, "data.json")
                    if os.path.exists(bundled_file):
                        import shutil
                        try:
                            shutil.copy2(bundled_file, target_file)
                        except Exception:
                            pass
        return folder
    return os.path.dirname(os.path.abspath(__file__))


BASE_DIR    = _get_app_dir()
DATA_FILE   = os.path.join(BASE_DIR, "data.json")
ARCHIVE_DIR = os.path.join(BASE_DIR, "archivos")
VERSION     = "2.6.0"

DEFAULT_DATA = {
    "producto_tipos": [],
    "categorias_por_tipo": {},
    "variantes_cantidad_por_tipo": {},
    "variantes_tipo_por_tipo": {},
    "catalogo": [],
    "historial": [],
    "last_seen_date": "",
    "last_seen_month": "",
    "nombre_negocio": "La Extra",
    "notas": [],
    "stock": [],
    "gastos": [],
    "config": {
        "nombre_negocio": "La Extra",
        "direccion": "Calle Ejemplo 123",
        "telefono": "11 2233-4455",
        "instagram": "@laextra.ok",
        "github_owner": "Usagi-Intelligence",
        "github_repo": "la-extra"
    }
}


# ── Singleton data store ──────────────────────────────────────────────────────

_data = None


def get_data():
    global _data
    if _data is None:
        _data = load_data()
        _data, _ = run_startup_checks(_data)
    return _data


def reload_data():
    global _data
    _data = load_data()
    return _data


def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            d = json.load(f)
        _migrate(d)
        return d
    return json.loads(json.dumps(DEFAULT_DATA))


def _migrate(d):
    """Apply all data migrations for backwards compatibility."""
    for item in d.get("catalogo", []):
        if "gusto" in item and "nombre" not in item:
            item["nombre"] = item.pop("gusto")
        item.pop("precio_md", None)
        item.pop("precio_d", None)
        item.setdefault("sin_stock", False)
        item.setdefault("separar_stock_coccion", False)
        item.setdefault("categoria", "Comunes")
        tipo_val = item.get("tipo_id")
        if tipo_val is None:
            tipos = d.get("producto_tipos", [])
            item["tipo_id"] = tipos[0]["id"] if tipos else 1
        else:
            try:
                item["tipo_id"] = int(tipo_val)
            except (ValueError, TypeError):
                tipos = d.get("producto_tipos", [])
                item["tipo_id"] = tipos[0]["id"] if tipos else 1
        item.setdefault("precio_u", 0)
        if "variantes" in item and "precios_variantes" not in item:
            item["precios_variantes"] = {
                v["nombre"]: v["precio"] for v in item.pop("variantes")
            }
        item.setdefault("precios_variantes", {})
        item.pop("variantes", None)
        item.setdefault("variantes_inactivas", [])
        item.setdefault("abrev", "")
        item.setdefault("abreviacion", "")

    abrev_set = {p["abrev"].upper() for p in d.get("catalogo", []) if p.get("abrev")}
    for p in d.get("catalogo", []):
        if not p.get("abrev"):
            p["abrev"] = auto_abrev(p["nombre"], abrev_set)
            abrev_set.add(p["abrev"].upper())

    d.setdefault("producto_tipos", [])
    for t in d.get("producto_tipos", []):
        t.setdefault("admite_variantes_cantidad", False)
        t.setdefault("admite_variantes_tipo", False)
        t.setdefault("descuento_efectivo", True)
        t.setdefault("separar_stock_coccion", False)

    # Ensure system fixed 'Promociones' type (ID 999) exists
    promo_tipo = next((t for t in d["producto_tipos"] if t["id"] == 999), None)
    if not promo_tipo:
        promo_tipo = {
            "id": 999,
            "nombre": "Promociones",
            "admite_variantes_cantidad": False,
            "admite_variantes_tipo": False,
            "descuento_efectivo": False
        }
        d["producto_tipos"].append(promo_tipo)
    else:
        promo_tipo["nombre"] = "Promociones"
        promo_tipo["descuento_efectivo"] = False

    d.setdefault("categorias_por_tipo", {})
    d.setdefault("variantes_cantidad_por_tipo", {})
    d.setdefault("variantes_tipo_por_tipo", {})
    d["variantes_cantidad_por_tipo"]["999"] = []
    d["variantes_tipo_por_tipo"]["999"] = []

    d.setdefault("last_seen_date", "")
    d.setdefault("last_seen_month", "")
    d.setdefault("nombre_negocio", "La Extra")
    d.setdefault("notas", [])
    d.setdefault("config", {})
    if isinstance(d.get("config"), dict):
        d["config"].setdefault("whatsapp_url", "")
        d["config"].setdefault("whatsapp_token", "")
        d["config"].setdefault("whatsapp_instance", "laextra")
    d.setdefault("stock", [])
    d.setdefault("gastos", [])

    # Migrate: ensure total includes envio cost
    for p in d.get("historial", []):
        env = p.get("envio", {})
        env_c = env.get("costo_envio", 0) or 0
        cpaga = env.get("cliente_paga_envio", True)
        if env.get("envio") and cpaga and env_c > 0:
            sub = p.get("subtotal", 0)
            desc = p.get("descuento", 0)
            expected_no = sub - desc
            expected_with = expected_no + env_c
            if abs(p.get("total", 0) - expected_no) < 1:
                p["total"] = int(expected_with)


def save_data(data=None):
    if data is None:
        data = get_data()
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ── Formatting ────────────────────────────────────────────────────────────────

def fmt_money(n):
    return f"${int(n):,}".replace(",", ".")


def fmt_elapsed(seconds):
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h > 0:
        return f"{h}h {m}m {s}s"
    if m > 0:
        return f"{m}m {s}s"
    return f"{s}s"


def fmt_nombre(s):
    return s.lstrip().title()


def fmt_telefono(s):
    return "".join(c for c in s if c.isdigit() or c == "+")


def fmt_producto(s):
    return s.strip().upper()


# ── Discount logic ────────────────────────────────────────────────────────────

def apply_efectivo_discount(amount):
    """Apply 10.5% discount and round to nearest 100."""
    return round(amount * (1 - 0.105) / 100) * 100


def apply_efectivo_discount_items(items, tipos):
    """Apply 10.5% only to items whose tipo has descuento_efectivo=True or has a float discount factor."""
    tipo_by_id = {t["id"]: t for t in tipos}
    tipo_by_name = {t["nombre"]: t for t in tipos}

    def _get_tipo(it):
        if it.get("tipo_id"):
            return tipo_by_id.get(it["tipo_id"], {})
        return tipo_by_name.get(it.get("tipo", ""), {})

    total_desc = 0.0
    total_nodesc = 0.0
    for it in items:
        qty = it.get("cantidad", 1)
        price = it.get("precio", 0)
        sub = qty * price
        
        factor = 1.0
        if "descuento_efectivo" in it:
            val = it["descuento_efectivo"]
            if isinstance(val, bool):
                factor = 1.0 if val else 0.0
            elif isinstance(val, (int, float)):
                factor = float(val)
        else:
            t = _get_tipo(it)
            has_d = t.get("descuento_efectivo", True) if t else False
            factor = 1.0 if has_d else 0.0
            
        total_desc += sub * factor
        total_nodesc += sub * (1.0 - factor)
        
    return round((total_desc * (1 - 0.105) + total_nodesc) / 100) * 100


# ── Query helpers ─────────────────────────────────────────────────────────────

def get_tipo(data, tipo_id):
    return next((x for x in data["producto_tipos"] if x["id"] == tipo_id), {})


def get_tipo_nombre(data, tipo_id):
    t = get_tipo(data, tipo_id)
    return t.get("nombre", "?")


def get_cats_for_tipo(data, tipo_id):
    return data.get("categorias_por_tipo", {}).get(str(tipo_id), [])


def get_vars_cantidad(data, tipo_id):
    return data.get("variantes_cantidad_por_tipo", {}).get(str(tipo_id), [])


def get_vars_tipo(data, tipo_id):
    return data.get("variantes_tipo_por_tipo", {}).get(str(tipo_id), [])


# ── Envio helpers (BUG FIX #4: checks costo_desconocido) ─────────────────────

def get_envio_cost(envio_data):
    """Return envio cost charged to client. Returns 0 if unknown or not applicable."""
    if not envio_data:
        return 0
    if (envio_data.get("envio")
            and envio_data.get("cliente_paga_envio", True)
            and not envio_data.get("costo_desconocido")):
        try:
            return float(envio_data.get("costo_envio") or 0)
        except (ValueError, TypeError):
            return 0
    return 0


# ── Product search (BUG FIX #2: no more "variante" key) ──────────────────────

def search_products(data, query):
    """Find products matching query by abbreviation or name. Returns list of dicts."""
    query = query.strip().upper()
    if not query:
        return []

    matches = []
    for prod in data.get("catalogo", []):
        if prod.get("sin_stock"):
            continue
        tipo = next(
            (t for t in data.get("producto_tipos", []) if t["id"] == prod["tipo_id"]),
            None
        )
        if not tipo:
            continue

        has_dims = tipo.get("admite_variantes_cantidad") or tipo.get("admite_variantes_tipo")
        if prod.get("tipo_id") == 999:
            # Promociones are always searchable
            pass
        elif has_dims:
            pv = prod.get("precios_variantes", {})
            inact = prod.get("variantes_inactivas", [])
            if not any(v > 0 for k, v in pv.items() if k not in inact):
                continue
        elif not prod.get("precio_u", 0):
            continue

        abrev = (prod.get("abrev", "") or "").upper()
        nombre = prod["nombre"].upper()
        score = 0
        if abrev and query == abrev:
            score = 100
        elif abrev and abrev.startswith(query):
            score = 80
        elif nombre.startswith(query):
            score = 70
        elif query in nombre:
            score = 50

        if score > 0:
            matches.append((score, prod, tipo))

    matches.sort(key=lambda x: -x[0])
    return [{"product": p, "tipo": t} for _, p, t in matches[:8]]


def get_active_tipo_variants(data, product):
    """Get active tipo (style) variants for a product."""
    tipo = get_tipo(data, product["tipo_id"])
    tid = product["tipo_id"]
    inactivas = product.get("variantes_inactivas", [])
    vars_t = get_vars_tipo(data, tid)
    vars_c = get_vars_cantidad(data, tid)

    if not tipo.get("admite_variantes_tipo") or not vars_t:
        return []

    avc_names = [v["nombre"] for v in vars_c] if tipo.get("admite_variantes_cantidad") and vars_c else []
    result = []
    for vt in vars_t:
        if not avc_names:
            if vt not in inactivas:
                result.append(vt)
        else:
            if not all(f"{vt}|{vc}" in inactivas for vc in avc_names):
                result.append(vt)
    return result


def get_active_cant_variants(data, product, var_tipo=None):
    """Get active cantidad (size) variants for a product, optionally filtered by tipo variant."""
    tipo = get_tipo(data, product["tipo_id"])
    inactivas = product.get("variantes_inactivas", [])
    vars_c = get_vars_cantidad(data, product["tipo_id"])

    if not tipo.get("admite_variantes_cantidad") or not vars_c:
        return []

    result = []
    for vc in vars_c:
        key = f"{var_tipo}|{vc['nombre']}" if var_tipo else vc["nombre"]
        if key not in inactivas:
            result.append(vc["nombre"])
    return result


def get_product_price(product, var_tipo="", var_cant=""):
    """Get price for a product+variant combination."""
    pv = product.get("precios_variantes", {})
    if var_tipo and var_cant:
        key = f"{var_tipo}|{var_cant}"
    elif var_tipo:
        key = var_tipo
    elif var_cant:
        key = var_cant
    else:
        key = ""
    return pv.get(key, product.get("precio_u", 0)) if key else product.get("precio_u", 0)


# ── Abbreviation ──────────────────────────────────────────────────────────────

def auto_abrev(nombre, existing_abrevs):
    words = re.sub(r'[^A-Za-zÁÉÍÓÚáéíóúÑñ ]', '', nombre).upper().split()
    candidates = []
    if words:
        initials = ''.join(w[0] for w in words if w not in ('Y', 'DE', 'LA', 'EL', 'LOS'))
        if initials:
            candidates.append(initials[:3])
        candidates.append(words[0][:2])
        candidates.append(words[0][:3])
        if len(words) > 1:
            candidates.append(words[0][0] + words[1][0])
    for c in candidates:
        if c and c.upper() not in existing_abrevs:
            return c
    base = nombre[:2].upper()
    for i in range(2, 99):
        cand = base + str(i)
        if cand not in existing_abrevs:
            return cand
    return nombre[:3].upper()


# ── Pedido CRUD (BUG FIX #1: max(id)+1) ──────────────────────────────────────

def next_pedido_id(data):
    return max((p["id"] for p in data["historial"]), default=0) + 1


# ── Stock helpers ─────────────────────────────────────────────────────────────

def next_stock_id(data):
    return max((s["id"] for s in data.get("stock", [])), default=0) + 1


def clean_variant_name(v):
    if not v:
        return ""
    import re
    return re.sub(r'\{[^}]+\}', '', v).strip()


def get_variant_multiplier(var_cant):
    if not var_cant:
        return 1.0
    import re
    match = re.search(r'\{([^}]+)\}', var_cant)
    if match:
        frac_str = match.group(1).strip()
        if '/' in frac_str:
            try:
                num, denom = frac_str.split('/')
                return float(num) / float(denom)
            except Exception:
                pass
        else:
            try:
                return float(frac_str)
            except Exception:
                pass
    return 1.0


def descontar_stock_por_pedido(data, pedido):
    """Subtract stock quantities for each item in a delivered pedido (matched by producto_id and var_tipo)."""
    order_date = pedido.get("fecha", datetime.now().strftime("%d/%m/%Y"))
    stock = data.get("stock", [])
    for item in pedido.get("items", []):
        pid = item.get("producto_id")
        if not pid:
            continue
        qty = item.get("cantidad", 1)
        multiplier = get_variant_multiplier(item.get("var_cantidad"))
        dec_qty = float(qty) * multiplier
        
        item_var_tipo = item.get("var_tipo", "")
        # Find matching stock entry by product, date, and specific var_tipo
        matched_stock = None
        for s in stock:
            if s.get("producto_id") == pid and s.get("fecha") == order_date and s.get("var_tipo", "") == item_var_tipo:
                matched_stock = s
                break
        # Fallback to general stock entry if specific option not found in stock
        if not matched_stock:
            for s in stock:
                if s.get("producto_id") == pid and s.get("fecha") == order_date and s.get("var_tipo", "") == "":
                    matched_stock = s
                    break
                    
        if matched_stock:
            matched_stock["cantidad_actual"] = max(0.0, float(matched_stock.get("cantidad_actual", 0)) - dec_qty)


def devolver_stock_por_pedido(data, pedido):
    """Refund stock quantities for each item in a re-opened/deleted pedido."""
    order_date = pedido.get("fecha", datetime.now().strftime("%d/%m/%Y"))
    stock = data.get("stock", [])
    for item in pedido.get("items", []):
        pid = item.get("producto_id")
        if not pid:
            continue
        qty = item.get("cantidad", 1)
        multiplier = get_variant_multiplier(item.get("var_cantidad"))
        dec_qty = float(qty) * multiplier
        
        item_var_tipo = item.get("var_tipo", "")
        # Find matching stock entry by product, date, and specific var_tipo
        matched_stock = None
        for s in stock:
            if s.get("producto_id") == pid and s.get("fecha") == order_date and s.get("var_tipo", "") == item_var_tipo:
                matched_stock = s
                break
        # Fallback to general stock entry if specific option not found in stock
        if not matched_stock:
            for s in stock:
                if s.get("producto_id") == pid and s.get("fecha") == order_date and s.get("var_tipo", "") == "":
                    matched_stock = s
                    break
                    
        if matched_stock:
            matched_stock["cantidad_actual"] = float(matched_stock.get("cantidad_actual", 0)) + dec_qty


# ── Gastos helpers ────────────────────────────────────────────────────────────

def next_gasto_id(data):
    return max((g["id"] for g in data.get("gastos", [])), default=0) + 1


def calcular_gastos_mes(data, mes_str):
    """Return (total_gastos, breakdown_dict) for a given month in MM/YYYY format."""
    import calendar as _cal
    gastos = data.get("gastos", [])
    total = 0.0
    fijos = []
    particulares = []

    try:
        mes_dt = datetime.strptime(mes_str, "%m/%Y")
    except Exception:
        return 0, {"fijos": [], "particulares": []}

    dias_mes = _cal.monthrange(mes_dt.year, mes_dt.month)[1]

    for g in gastos:
        if g.get("tipo") == "fijo" and g.get("activo", True):
            monto = float(g.get("monto", 0))
            rec = g.get("recurrencia") or "1_meses"
            
            # Parse new custom recurrence: "cant_interval" (e.g., "3_dias" or "1_meses")
            if "_" in rec:
                try:
                    cant_str, unit = rec.split("_")
                    cant = max(1, int(cant_str))
                except Exception:
                    cant, unit = 1, "meses"
            else:
                # Backward compatibility mapping
                if rec == "diaria":
                    cant, unit = 1, "dias"
                elif rec == "semanal":
                    cant, unit = 1, "semanas"
                elif rec == "anual":
                    cant, unit = 12, "meses"
                else: # mensual
                    cant, unit = 1, "meses"
            
            # Prorated calculation
            if unit == "dias":
                mensual = (monto / cant) * dias_mes
            elif unit == "semanas":
                mensual = (monto / cant) * (dias_mes / 7.0)
            elif unit == "meses":
                mensual = monto / cant
            else:
                mensual = monto
                
            total += mensual
            fijos.append({**g, "monto_mensual": round(mensual)})
        elif g.get("tipo") == "particular":
            try:
                g_dt = datetime.strptime(g.get("fecha", ""), "%d/%m/%Y")
                if g_dt.month == mes_dt.month and g_dt.year == mes_dt.year:
                    total += float(g.get("monto", 0))
                    particulares.append(g)
            except Exception:
                pass

    return round(total), {"fijos": fijos, "particulares": particulares}


def create_pedido(data, cliente, telefono, hora_retiro, items, descuento_pct, pago, envio):
    subtotal = sum(it["cantidad"] * it["precio"] for it in items)
    descuento = subtotal * descuento_pct / 100
    total = subtotal - descuento

    envio_cost = get_envio_cost(envio)

    if pago.get("metodo") == "Efectivo" and pago.get("total_efectivo"):
        total_final = int(pago["total_efectivo"])
    else:
        total_final = int(total + envio_cost)

    conteo = defaultdict(int)
    for it in items:
        k = it["nombre"]
        if it.get("var_cantidad"):
            clean_vc = clean_variant_name(it["var_cantidad"])
            if clean_vc:
                k += f" ({clean_vc})"
        if it.get("var_tipo"):
            k += f" — {it['var_tipo']}"
        conteo[k] += it["cantidad"]

    pedido = {
        "id": next_pedido_id(data),
        "fecha": datetime.now().strftime("%d/%m/%Y"),
        "hora_registro": datetime.now().strftime("%H:%M"),
        "hora_retiro": hora_retiro,
        "ts_inicio": datetime.now().timestamp(),
        "ts_entrega": None,
        "cliente": fmt_nombre(cliente),
        "telefono": fmt_telefono(telefono),
        "notas": "",
        "detalle_compact": "\n".join(f"{k}: {v}" for k, v in conteo.items()),
        "detalle": ", ".join(
            f"{it['cantidad']}x {it['nombre']}"
            f"{' (' + clean_variant_name(it['var_cantidad']) + ')' if it.get('var_cantidad') else ''}"
            f"{' — ' + it['var_tipo'] if it.get('var_tipo') else ''}"
            for it in items
        ),
        "items": items,
        "subtotal": subtotal,
        "descuento": descuento,
        "total": total_final,
        "pago": pago,
        "envio": envio,
        "estado": "En curso",
        "elapsed": None,
    }

    data["historial"].append(pedido)
    save_data(data)
    return pedido


# ── Startup checks ───────────────────────────────────────────────────────────

def _archive_old_orders(data, msgs):
    """Move pedidos from previous months/years into archivos/historial_YYYY.json."""
    now = datetime.now()
    current_month_str = now.strftime("%m/%Y")
    try:
        current_month_dt = datetime.strptime(current_month_str, "%m/%Y")
    except Exception:
        return

    old_pedidos = []
    kept = []
    for p in data.get("historial", []):
        try:
            fecha_parts = p.get("fecha", "").split("/")
            if len(fecha_parts) < 3:
                kept.append(p)
                continue
            p_month_str = f"{fecha_parts[1]}/{fecha_parts[2]}"
            p_month_dt = datetime.strptime(p_month_str, "%m/%Y")
            if p_month_dt < current_month_dt:
                old_pedidos.append(p)
            else:
                kept.append(p)
        except Exception:
            kept.append(p)
            continue

    if not old_pedidos:
        return

    # Group by year
    by_year = {}
    for p in old_pedidos:
        try:
            year = int(p["fecha"].split("/")[2])
        except (IndexError, ValueError):
            continue
        by_year.setdefault(year, []).append(p)

    for year, pedidos in by_year.items():
        fname = f"historial_{year}.json"
        fpath = os.path.join(ARCHIVE_DIR, fname)
        try:
            if os.path.exists(fpath):
                with open(fpath, "r", encoding="utf-8") as f:
                    existing = json.load(f)
                ex_ids = {p["id"] for p in existing}
                existing += [p for p in pedidos if p["id"] not in ex_ids]
                with open(fpath, "w", encoding="utf-8") as f:
                    json.dump(existing, f, ensure_ascii=False, indent=2)
            else:
                with open(fpath, "w", encoding="utf-8") as f:
                    json.dump(pedidos, f, ensure_ascii=False, indent=2)
            msgs.append(f"📁 {len(pedidos)} pedidos anteriores al mes actual archivados en {fname}.")
        except Exception as e:
            msgs.append(f"⚠ No se pudo archivar año {year}: {e}")

    data["historial"] = kept


def get_all_time_pedidos(data):
    """Return active and yearly archived pedidos."""
    pedidos = list(data.get("historial", []))
    if os.path.exists(ARCHIVE_DIR):
        for fname in os.listdir(ARCHIVE_DIR):
            if fname.startswith("historial_") and fname.endswith(".json"):
                fpath = os.path.join(ARCHIVE_DIR, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        archived = json.load(f)
                    existing_ids = {p["id"] for p in pedidos}
                    for p in archived:
                        if p["id"] not in existing_ids:
                            pedidos.append(p)
                except Exception:
                    pass
    return pedidos


def run_startup_checks(data):
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    today = datetime.now().strftime("%d/%m/%Y")
    this_month = datetime.now().strftime("%m/%Y")
    msgs = []

    last_date = data.get("last_seen_date", "")
    if last_date and last_date != today:
        closed = 0
        for p in data["historial"]:
            if p.get("fecha") == last_date and p.get("estado") == "En curso":
                p["estado"] = "Entregado"
                p["elapsed"] = p.get("elapsed") or 0
                closed += 1
        if closed:
            msgs.append(f"🔒 {closed} pedido(s) cerrados automáticamente.")

        prev = [p for p in data["historial"] if p.get("fecha") == last_date]
        if prev:
            try:
                dt = datetime.strptime(last_date, "%d/%m/%Y")
                fname = dt.strftime("%Y-%m-%d") + ".json"
                fpath = os.path.join(ARCHIVE_DIR, fname)
                if os.path.exists(fpath):
                    with open(fpath, "r", encoding="utf-8") as f:
                        ex = json.load(f)
                    ex_ids = {p["id"] for p in ex}
                    ex += [p for p in prev if p["id"] not in ex_ids]
                    with open(fpath, "w", encoding="utf-8") as f:
                        json.dump(ex, f, ensure_ascii=False, indent=2)
                else:
                    with open(fpath, "w", encoding="utf-8") as f:
                        json.dump(prev, f, ensure_ascii=False, indent=2)
                msgs.append(f"📁 {len(prev)} pedidos del {last_date} archivados.")
            except Exception as e:
                msgs.append(f"⚠ No se pudo archivar: {e}")

    # Archive pedidos from previous months/years
    _archive_old_orders(data, msgs)

    data["last_seen_date"] = today
    data["last_seen_month"] = this_month
    save_data(data)

    for nota in data.get("notas", []):
        if nota.get("recordar"):
            msgs.append(f"🟡 Recordatorio: {nota.get('titulo', '')}")

    return data, msgs
