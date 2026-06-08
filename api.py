"""
REST API Blueprint for La Extra.
All data operations go through data_model.py.
"""
from flask import Blueprint, request, jsonify, send_file  # pyrefly: ignore[missing-import]
from datetime import datetime, timedelta
import os
import json
import data_model as dm  # pyrefly: ignore[missing-import]

api = Blueprint("api", __name__, url_prefix="/api")


# ── Tipos ─────────────────────────────────────────────────────────────────────

@api.route("/tipos", methods=["GET"])
def list_tipos():
    data = dm.get_data()
    tipos = data.get("producto_tipos", [])
    
    enriched = []
    for t in tipos:
        tid = str(t["id"])
        vt = data.get("variantes_tipo_por_tipo", {}).get(tid, [])
        vc = data.get("variantes_cantidad_por_tipo", {}).get(tid, [])
        enriched.append({
            **t,
            "variantes_tipo": vt,
            "variantes_cantidad": [c["nombre"] for c in vc]
        })
    return jsonify(enriched)

@api.route("/tipos", methods=["POST"])
def create_tipo():
    data = dm.get_data()
    body = request.get_json()
    tipos = data.get("producto_tipos", [])
    
    new_id = max((t["id"] for t in tipos), default=0) + 1
    nuevo_tipo = {
        "id": new_id,
        "nombre": body.get("nombre", "").strip(),
        "admite_variantes_tipo": bool(body.get("admite_variantes_tipo")),
        "admite_variantes_cantidad": bool(body.get("admite_variantes_cantidad")),
        "separar_stock_coccion": bool(body.get("separar_stock_coccion")),
        "descuento_efectivo": bool(body.get("descuento_efectivo", True))
    }
    
    if not nuevo_tipo["nombre"]:
        return jsonify({"error": "El nombre es obligatorio"}), 400
        
    tipos.append(nuevo_tipo)
    data["producto_tipos"] = tipos
    
    data.setdefault("variantes_tipo_por_tipo", {})[str(new_id)] = body.get("variantes_tipo", [])
    data.setdefault("variantes_cantidad_por_tipo", {})[str(new_id)] = [{"nombre": n.strip()} for n in body.get("variantes_cantidad", []) if n.strip()]
    
    dm.save_data(data)
    return jsonify(nuevo_tipo), 201

@api.route("/tipos/<int:tipo_id>", methods=["PUT"])
def update_tipo(tipo_id):
    if tipo_id == 999:
        return jsonify({"error": "No se puede modificar el tipo del sistema 'Promociones'"}), 400
        
    data = dm.get_data()
    body = request.get_json()
    tipos = data.get("producto_tipos", [])
    
    tipo = next((t for t in tipos if t["id"] == tipo_id), None)
    if not tipo:
        return jsonify({"error": "Tipo no encontrado"}), 404
        
    nombre = body.get("nombre", "").strip()
    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400
        
    tipo["nombre"] = nombre
    tipo["admite_variantes_tipo"] = bool(body.get("admite_variantes_tipo"))
    tipo["admite_variantes_cantidad"] = bool(body.get("admite_variantes_cantidad"))
    tipo["separar_stock_coccion"] = bool(body.get("separar_stock_coccion"))
    tipo["descuento_efectivo"] = bool(body.get("descuento_efectivo", True))
    
    data.setdefault("variantes_tipo_por_tipo", {})[str(tipo_id)] = body.get("variantes_tipo", [])
    data.setdefault("variantes_cantidad_por_tipo", {})[str(tipo_id)] = [{"nombre": n.strip()} for n in body.get("variantes_cantidad", []) if n.strip()]
    
    dm.save_data(data)
    return jsonify(tipo)

@api.route("/tipos/<int:tipo_id>", methods=["DELETE"])
def delete_tipo(tipo_id):
    if tipo_id == 999:
        return jsonify({"error": "No se puede eliminar el tipo del sistema 'Promociones'"}), 400
        
    data = dm.get_data()
    tipos = data.get("producto_tipos", [])
    productos = data.get("catalogo", [])
    
    if any(p.get("tipo_id") == tipo_id for p in productos):
        return jsonify({"error": "No se puede eliminar porque hay productos usando este tipo"}), 400
        
    before = len(tipos)
    data["producto_tipos"] = [t for t in tipos if t["id"] != tipo_id]
    
    if len(data["producto_tipos"]) == before:
        return jsonify({"error": "Tipo no encontrado"}), 404
        
    dm.save_data(data)
    return jsonify({"ok": True})


# ── Productos ─────────────────────────────────────────────────────────────────

@api.route("/productos")
def list_productos():
    data = dm.get_data()
    tipo_id = request.args.get("tipo_id", type=int)
    productos = data.get("catalogo", [])
    if tipo_id is not None:
        productos = [p for p in productos if p["tipo_id"] == tipo_id]
    return jsonify(productos)


@api.route("/productos/search")
def search_productos():
    data = dm.get_data()
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    results = dm.search_products(data, q)
    return jsonify(results)


@api.route("/productos/<int:prod_id>/variants")
def product_variants(prod_id):
    data = dm.get_data()
    prod = next((p for p in data["catalogo"] if p["id"] == prod_id), None)
    if not prod:
        return jsonify({"error": "Producto no encontrado"}), 404

    var_tipo_sel = request.args.get("var_tipo", "")
    tipo_variants = dm.get_active_tipo_variants(data, prod)
    cant_variants = dm.get_active_cant_variants(data, prod, var_tipo_sel or None)

    tipo_obj = dm.get_tipo(data, prod["tipo_id"])

    return jsonify({
        "has_tipo": bool(tipo_obj.get("admite_variantes_tipo") and tipo_variants),
        "has_cant": bool(tipo_obj.get("admite_variantes_cantidad") and cant_variants),
        "variantes_tipo": tipo_variants,
        "variantes_cantidad": cant_variants,
    })


@api.route("/productos/<int:prod_id>/price")
def product_price(prod_id):
    data = dm.get_data()
    prod = next((p for p in data["catalogo"] if p["id"] == prod_id), None)
    if not prod:
        return jsonify({"error": "Producto no encontrado"}), 404

    var_tipo = request.args.get("var_tipo", "")
    var_cant = request.args.get("var_cant", "")
    price = dm.get_product_price(prod, var_tipo, var_cant)
    return jsonify({"price": price})


@api.route("/productos", methods=["POST"])
def create_producto():
    data = dm.get_data()
    body = request.get_json()
    
    tipo_id = body.get("tipo_id")
    if tipo_id is None:
        return jsonify({"error": "El tipo de producto es obligatorio."}), 400
    try:
        tipo_id = int(tipo_id)
    except (ValueError, TypeError):
        return jsonify({"error": "El tipo de producto debe ser un número válido."}), 400
        
    tipos = data.get("producto_tipos", [])
    if not any(t["id"] == tipo_id for t in tipos):
        return jsonify({"error": "El tipo de producto seleccionado no existe."}), 400
        
    if tipo_id == 999:
        promo_items = body.get("promo_items", [])
        if not isinstance(promo_items, list) or not promo_items:
            return jsonify({"error": "Una promoción debe contener al menos un ítem."}), 400
        for it in promo_items:
            try:
                it_tipo_id = int(it.get("tipo_id"))
            except (ValueError, TypeError):
                return jsonify({"error": "Ítem de promoción con tipo de producto inválido."}), 400
            if it_tipo_id == 999:
                return jsonify({"error": "No se puede agregar una promoción dentro de otra promoción."}), 400

    new_id = max((p["id"] for p in data.get("catalogo", [])), default=0) + 1
    
    prod = {
        "id": new_id,
        "nombre": dm.fmt_producto(body.get("nombre", "")),
        "abrev": body.get("abrev", "").strip().upper()[:4],
        "categoria": body.get("categoria", "Comunes"),
        "tipo_id": tipo_id,
        "precio_u": float(body.get("precio_u", 0)),
        "sin_stock": False,
        "precios_variantes": body.get("precios_variantes", {}),
        "variantes_inactivas": body.get("variantes_inactivas", []),
        "descuento_efectivo": bool(body.get("descuento_efectivo", False)),
        "excluir_descuento_efectivo": bool(body.get("excluir_descuento_efectivo", False)),
        "promo_items": body.get("promo_items", []) if tipo_id == 999 else []
    }
    
    # Auto abrev if empty
    if not prod["abrev"]:
        existing = {p["abrev"].upper() for p in data.get("catalogo", []) if p.get("abrev")}
        prod["abrev"] = dm.auto_abrev(prod["nombre"], existing)
        
    data.setdefault("catalogo", []).append(prod)
    dm.save_data(data)
    return jsonify(prod), 201


@api.route("/productos/<int:prod_id>", methods=["PUT"])
def update_producto(prod_id):
    data = dm.get_data()
    body = request.get_json()
    
    prod = next((p for p in data["catalogo"] if p["id"] == prod_id), None)
    if not prod:
        return jsonify({"error": "Producto no encontrado"}), 404
        
    if "nombre" in body: prod["nombre"] = dm.fmt_producto(body["nombre"])
    if "abrev" in body: prod["abrev"] = body["abrev"].strip().upper()[:4]
    if "categoria" in body: prod["categoria"] = body["categoria"]
    if "precio_u" in body: prod["precio_u"] = float(body["precio_u"])
    if "sin_stock" in body: prod["sin_stock"] = bool(body["sin_stock"])
    
    if "tipo_id" in body:
        tipo_id = body.get("tipo_id")
        if tipo_id is None:
            return jsonify({"error": "El tipo de producto es obligatorio."}), 400
        try:
            tipo_id = int(tipo_id)
        except (ValueError, TypeError):
            return jsonify({"error": "El tipo de producto debe ser un número válido."}), 400
            
        tipos = data.get("producto_tipos", [])
        if not any(t["id"] == tipo_id for t in tipos):
            return jsonify({"error": "El tipo de producto seleccionado no existe."}), 400
            
        if tipo_id == 999:
            promo_items = body.get("promo_items", prod.get("promo_items", []))
            if not isinstance(promo_items, list) or not promo_items:
                return jsonify({"error": "Una promoción debe contener al menos un ítem."}), 400
            for it in promo_items:
                try:
                    it_tipo_id = int(it.get("tipo_id"))
                except (ValueError, TypeError):
                    return jsonify({"error": "Ítem de promoción con tipo de producto inválido."}), 400
                if it_tipo_id == 999:
                    return jsonify({"error": "No se puede agregar una promoción dentro de otra promoción."}), 400
        
        prod["tipo_id"] = tipo_id
        
    if "precios_variantes" in body: prod["precios_variantes"] = body["precios_variantes"]
    if "variantes_inactivas" in body: prod["variantes_inactivas"] = body["variantes_inactivas"]
    if "descuento_efectivo" in body: prod["descuento_efectivo"] = bool(body["descuento_efectivo"])
    if "excluir_descuento_efectivo" in body: prod["excluir_descuento_efectivo"] = bool(body["excluir_descuento_efectivo"])
    if "promo_items" in body:
        promo_items = body["promo_items"]
        if prod.get("tipo_id") == 999 or body.get("tipo_id") == 999:
            if not isinstance(promo_items, list) or not promo_items:
                return jsonify({"error": "Una promoción debe contener al menos un ítem."}), 400
            for it in promo_items:
                try:
                    it_tipo_id = int(it.get("tipo_id"))
                except (ValueError, TypeError):
                    return jsonify({"error": "Ítem de promoción con tipo de producto inválido."}), 400
                if it_tipo_id == 999:
                    return jsonify({"error": "No se puede agregar una promoción dentro de otra promoción."}), 400
            prod["promo_items"] = promo_items
        else:
            prod["promo_items"] = []

    dm.save_data(data)
    return jsonify(prod)


@api.route("/productos/<int:prod_id>", methods=["DELETE"])
def delete_producto(prod_id):
    data = dm.get_data()
    before = len(data.get("catalogo", []))
    data["catalogo"] = [p for p in data.get("catalogo", []) if p["id"] != prod_id]
    
    if len(data["catalogo"]) == before:
        return jsonify({"error": "Producto no encontrado"}), 404
        
    dm.save_data(data)
    return jsonify({"ok": True})



# ── Pedidos ───────────────────────────────────────────────────────────────────

@api.route("/pedidos")
def list_pedidos():
    data = dm.get_data()
    fecha = request.args.get("fecha", "")
    estado = request.args.get("estado", "")
    search = request.args.get("search", "").strip().lower()

    pedidos = list(reversed(data.get("historial", [])))

    if fecha:
        pedidos = [p for p in pedidos if p.get("fecha") == fecha]
        if not pedidos:
            # Fallback 1: Try daily archive
            try:
                dt = datetime.strptime(fecha, "%d/%m/%Y")
                fname = dt.strftime("%Y-%m-%d") + ".json"
                fpath = os.path.join(dm.ARCHIVE_DIR, fname)
                if os.path.exists(fpath):
                    with open(fpath, "r", encoding="utf-8") as f:
                        pedidos = json.load(f)
                    pedidos = list(reversed(pedidos))
            except Exception:
                pass
            # Fallback 2: Try yearly archive
            if not pedidos:
                try:
                    dt = datetime.strptime(fecha, "%d/%m/%Y")
                    year_str = str(dt.year)
                    fpath = os.path.join(dm.ARCHIVE_DIR, f"historial_{year_str}.json")
                    if os.path.exists(fpath):
                        with open(fpath, "r", encoding="utf-8") as f:
                            yearly_pedidos = json.load(f)
                        pedidos = [p for p in yearly_pedidos if p.get("fecha") == fecha]
                        pedidos = list(reversed(pedidos))
                except Exception:
                    pass
    if estado and estado != "Todos":
        pedidos = [p for p in pedidos if p.get("estado") == estado]
    if search:
        pedidos = [p for p in pedidos if
                   (search in p.get("cliente", "").lower()) or
                   (search in p.get("telefono", "").lower())]

    return jsonify(pedidos)


@api.route("/pedidos", methods=["POST"])
def create_pedido():
    data = dm.get_data()
    body = request.get_json()

    cliente = body.get("cliente", "").strip()
    if not cliente:
        return jsonify({"error": "El nombre del cliente es obligatorio."}), 400

    items = body.get("items", [])
    if not items:
        return jsonify({"error": "Agregá al menos un producto."}), 400

    # Validate item amounts (prevent corrupted data)
    MAX_AMOUNT = 100_000_000  # $100M should cover any reasonable order
    MAX_QTY = 9999
    for it in items:
        if it.get("precio", 0) > MAX_AMOUNT or it.get("precio", 0) < 0:
            return jsonify({"error": f"Precio inválido para {it.get('nombre', '?')}"}), 400
        if it.get("cantidad", 1) > MAX_QTY or it.get("cantidad", 1) < 1:
            return jsonify({"error": f"Cantidad inválida para {it.get('nombre', '?')}"}), 400

    envio = body.get("envio", {"envio": False})
    if envio.get("costo_envio") and (float(envio.get("costo_envio", 0)) > MAX_AMOUNT or float(envio.get("costo_envio", 0)) < 0):
        return jsonify({"error": "Costo de envío inválido"}), 400

    pedido = dm.create_pedido(
        data,
        cliente=cliente,
        telefono=body.get("telefono", ""),
        hora_retiro=body.get("hora_retiro", ""),
        items=items,
        descuento_pct=body.get("descuento_pct", 0),
        pago=body.get("pago", {"metodo": "No especificado"}),
        envio=body.get("envio", {"envio": False}),
    )
    dm.descontar_stock_por_pedido(data, pedido)
    dm.save_data(data)

    return jsonify(pedido), 201


@api.route("/pedidos/<int:pid>/estado", methods=["PUT"])
def update_estado(pid):
    data = dm.get_data()
    body = request.get_json()
    nuevo_estado = body.get("estado", "")

    p = next((x for x in data["historial"] if x["id"] == pid), None)
    if not p:
        return jsonify({"error": "Pedido no encontrado"}), 404

    # datetime already imported at module level

    prev_estado = p.get("estado", "")

    if nuevo_estado == "Listo":
        p["estado"] = "Listo"
        p["elapsed"] = datetime.now().timestamp() - p["ts_inicio"] if p.get("ts_inicio") else None
    elif nuevo_estado == "Entregado":
        p["estado"] = "Entregado"
        p["pagado"] = True
        p["elapsed"] = datetime.now().timestamp() - p["ts_inicio"] if p.get("ts_inicio") else None
        if body.get("pago"):
            p["pago"] = body["pago"]
        if body.get("envio"):
            p["envio"] = body["envio"]
    elif nuevo_estado == "En curso":
        elapsed_so_far = p.get("elapsed") or 0
        p["estado"] = "En curso"
        p["ts_inicio"] = datetime.now().timestamp() - elapsed_so_far
        p["elapsed"] = None
    else:
        return jsonify({"error": "Estado no válido"}), 400

    dm.save_data(data)
    return jsonify(p)


@api.route("/pedidos/<int:pid>/pagado", methods=["PUT"])
def update_pedido_pagado(pid):
    data = dm.get_data()
    body = request.get_json()
    pagado = body.get("pagado", False)

    p = next((x for x in data["historial"] if x["id"] == pid), None)
    if not p:
        return jsonify({"error": "Pedido no encontrado"}), 404

    p["pagado"] = pagado
    dm.save_data(data)
    return jsonify(p)


@api.route("/pedidos/<int:pid>", methods=["PUT"])
def update_pedido(pid):
    data = dm.get_data()
    body = request.get_json()

    p = next((x for x in data["historial"] if x["id"] == pid), None)
    if not p:
        return jsonify({"error": "Pedido no encontrado"}), 404

    if "cliente" in body:
        p["cliente"] = dm.fmt_nombre(body["cliente"])
    if "telefono" in body:
        p["telefono"] = dm.fmt_telefono(body["telefono"])
    if "hora_retiro" in body:
        p["hora_retiro"] = body["hora_retiro"]
    if "items" in body:
        dm.devolver_stock_por_pedido(data, p)
        p["items"] = body["items"]
        dm.descontar_stock_por_pedido(data, p)
    if "pago" in body:
        p["pago"] = body["pago"]
    if "envio" in body:
        p["envio"] = body["envio"]

    # Recalculate totals if relevant fields changed
    if any(k in body for k in ["items", "descuento_pct", "pago", "envio"]):
        items = p.get("items", [])
        subtotal = sum(it.get("cantidad", 1) * it.get("precio", 0) for it in items)
        
        pct = body.get("descuento_pct", p.get("descuento_pct", 0)) or 0
        p["descuento_pct"] = pct
        
        descuento = subtotal * pct / 100
        p["subtotal"] = subtotal
        p["descuento"] = descuento
        
        envio_cost = dm.get_envio_cost(p.get("envio", {}))
        
        # Always recalculate efectivo total if the method is Efectivo
        if p.get("pago", {}).get("metodo") == "Efectivo":
            tipos = data.get("producto_tipos", [])
            p["pago"]["total_efectivo"] = dm.apply_efectivo_discount_items(items, tipos) + envio_cost
            p["total"] = int(p["pago"]["total_efectivo"])
        else:
            p["total"] = int(subtotal - descuento + envio_cost)

    # Recalculate detalle fields if items changed (BUG FIX: include variants like create_pedido does)
    if "items" in body:
        items = p.get("items", [])
        conteo = {}
        for it in items:
            k = it.get("nombre", "?")
            if it.get("var_cantidad"):
                clean_vc = dm.clean_variant_name(it["var_cantidad"])
                if clean_vc:
                    k += f" ({clean_vc})"
            if it.get("var_tipo"):
                k += f" — {it['var_tipo']}"
            conteo[k] = conteo.get(k, 0) + it.get("cantidad", 1)
        p["detalle_compact"] = "\n".join(f"{k}: {v}" for k, v in conteo.items())
        p["detalle"] = ", ".join(
            f"{it['cantidad']}x {it['nombre']}"
            f"{' (' + dm.clean_variant_name(it['var_cantidad']) + ')' if it.get('var_cantidad') else ''}"
            f"{' — ' + it['var_tipo'] if it.get('var_tipo') else ''}"
            for it in items
        )

    dm.save_data(data)
    return jsonify(p)


@api.route("/pedidos/<int:pid>", methods=["DELETE"])
def delete_pedido(pid):
    data = dm.get_data()
    p = next((x for x in data["historial"] if x["id"] == pid), None)
    if not p:
        return jsonify({"error": "Pedido no encontrado"}), 404
        
    # Refund stock for the deleted order
    dm.devolver_stock_por_pedido(data, p)
        
    data["historial"] = [x for x in data["historial"] if x["id"] != pid]
    dm.save_data(data)
    return jsonify({"ok": True})


# ── Config ────────────────────────────────────────────────────────────────────

@api.route("/config", methods=["GET", "PUT"])
def manage_config():
    data = dm.get_data()
    if request.method == "GET":
        return jsonify(data.get("config", {}))
    
    body = request.get_json()
    if "config" not in data:
        data["config"] = {}
        
    for k in ["nombre_negocio", "direccion", "telefono", "instagram", "reiniciar_stock_diariamente", "whatsapp_url", "whatsapp_token", "whatsapp_instance"]:
        if k in body:
            data["config"][k] = body[k]
            
    dm.save_data(data)
    return jsonify(data["config"])

@api.route("/info/stats", methods=["GET"])
def get_stats():
    data = dm.get_data()
    historial = dm.get_all_time_pedidos(data)
    
    # Calc stats
    total_pedidos = len(historial)
    clientes_unicos = len(set(p.get("cliente", "").lower() for p in historial if p.get("cliente")))
    
    file_size = os.path.getsize(dm.DATA_FILE) if os.path.exists(dm.DATA_FILE) else 0
    size_str = f"{file_size / 1024:.1f} KB" if file_size < 1024*1024 else f"{file_size / (1024*1024):.2f} MB"

    return jsonify({
        "total_pedidos": total_pedidos,
        "clientes_unicos": clientes_unicos,
        "file_size": size_str,
        "version": "2.2"
    })

@api.route("/info/backup", methods=["GET"])
def download_backup():
    if os.path.exists(dm.DATA_FILE):
        return send_file(dm.DATA_FILE, as_attachment=True, download_name=f"backup_la_extra_{datetime.now().strftime('%Y%m%d')}.json")
    return jsonify({"error": "No data file"}), 404

@api.route("/notas", methods=["GET"])
def get_notas():
    data = dm.get_data()
    return jsonify(data.get("notas", []))

@api.route("/notas", methods=["PUT"])
def update_notas():
    data = dm.get_data()
    body = request.get_json()
    data["notas"] = body
    dm.save_data(data)
    return jsonify({"ok": True})

@api.route("/resumen/hoy", methods=["GET"])
def resumen_hoy():
    data = dm.get_data()
    from collections import defaultdict
    
    hoy = datetime.now()
    hoy_str = hoy.strftime("%d/%m/%Y")
    
    historial = data.get("historial", [])
    
    todos = [p for p in historial if p.get("fecha") == hoy_str]
    entregados = [p for p in todos if p.get("estado") == "Entregado" or p.get("pagado") is True]
    
    facturacion = sum(p.get("total", 0) for p in entregados)
    
    tiempos = [p["elapsed"] for p in entregados if p.get("elapsed") is not None and p["elapsed"] > 0]
    promedio = sum(tiempos) / len(tiempos) if tiempos else 0
    
    ventas = defaultdict(int)
    tipos_dict = {}
    for p in todos:
        for item in p.get("items", []):
            nombre = item["nombre"]
            ventas[nombre] += item.get("cantidad", 1)
            tipos_dict[nombre] = item.get("tipo", "varios")
            
    productos_vendidos = [{"nombre": k, "cantidad": v, "tipo": tipos_dict[k]} for k, v in ventas.items()]
    productos_vendidos.sort(key=lambda x: x["cantidad"], reverse=True)
    
    # Last 7 days chart data
    dias_nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    ultimos_7 = []
    for i in range(6, -1, -1):
        dia = hoy - timedelta(days=i)
        dia_str = dia.strftime("%d/%m/%Y")
        dia_pedidos = [p for p in historial if p.get("fecha") == dia_str]
        dia_entregados = [p for p in dia_pedidos if p.get("estado") == "Entregado" or p.get("pagado") is True]
        dia_label = dias_nombres[dia.weekday()] if i > 0 else "Hoy"
        ultimos_7.append({
            "label": dia_label,
            "fecha": dia_str,
            "facturacion": sum(p.get("total", 0) for p in dia_entregados),
            "pedidos": len(dia_pedidos),
        })
    
    return jsonify({
        "pedidos": len(todos),
        "facturacion_neta": facturacion,
        "promedio_prep": promedio,
        "productos_vendidos": productos_vendidos,
        "ultimos_7_dias": ultimos_7
    })

import pdf_gen

@api.route("/cierre/verificar-ultimo-dia", methods=["GET"])
def verificar_cierre_ultimo_dia():
    dates = set()
    data = dm.get_data()
    
    # Active orders in historial
    for p in data.get("historial", []):
        fecha = p.get("fecha")
        if fecha:
            try:
                dt = datetime.strptime(fecha, "%d/%m/%Y")
                dates.add(dt.date())
            except Exception:
                pass
                
    # Archived daily/yearly orders in ARCHIVE_DIR
    if os.path.exists(dm.ARCHIVE_DIR):
        for fname in os.listdir(dm.ARCHIVE_DIR):
            if len(fname) == 15 and fname.endswith(".json"):
                parts = fname[:-5].split("-")
                if len(parts) == 3:
                    try:
                        dt = datetime.strptime(fname[:-5], "%Y-%m-%d")
                        dates.add(dt.date())
                    except Exception:
                        pass
            elif fname.startswith("historial_") and fname.endswith(".json"):
                try:
                    fpath = os.path.join(dm.ARCHIVE_DIR, fname)
                    with open(fpath, "r", encoding="utf-8") as f:
                        yearly = json.load(f)
                    for p in yearly:
                        p_fecha = p.get("fecha")
                        if p_fecha:
                            dt = datetime.strptime(p_fecha, "%d/%m/%Y")
                            dates.add(dt.date())
                except Exception:
                    pass
                        
    today_dt = datetime.now().date()
    past_dates = [d for d in dates if d < today_dt]
    
    if not past_dates:
        return jsonify({"need_cierre": False})
        
    last_day = max(past_dates)
    last_day_str = last_day.strftime("%d/%m/%Y")
    
    root = pdf_gen.get_cierres_dir()
    if not root:
        return jsonify({
            "need_cierre": True,
            "fecha": last_day_str,
            "cierres_path_configured": False
        })
        
    month_folder = pdf_gen._MESES_FOLDER[last_day.month]
    filename_date = last_day.strftime("%d-%m-%Y")
    pdf_path = os.path.join(root, "diarios", month_folder, f"{filename_date}.pdf")
    
    exists = os.path.exists(pdf_path)
    return jsonify({
        "need_cierre": not exists,
        "fecha": last_day_str,
        "cierres_path_configured": True
    })

@api.route("/cierre/diario", methods=["POST"])
def generar_cierre_diario():
    body = request.get_json()
    fecha = body.get("fecha")
    if not fecha:
        fecha = datetime.now().strftime("%d/%m/%Y")
    
    try:
        filename = pdf_gen.generar_pdf_diario(fecha)
    except ValueError as e:
        if "NO_CIERRES_PATH" in str(e):
            return jsonify({"error": "NO_CIERRES_PATH"}), 400
        raise
    try:
        if hasattr(os, 'startfile'):
            os.startfile(filename)
    except OSError:
        pass
    return jsonify({"ok": True, "file": filename})

@api.route("/cierre/mensual", methods=["POST"])
def generar_cierre_mensual():
    body = request.get_json()
    mes = body.get("mes")
    try:
        filename = pdf_gen.generar_pdf_mensual(mes)
    except ValueError as e:
        if "NO_CIERRES_PATH" in str(e):
            return jsonify({"error": "NO_CIERRES_PATH"}), 400
        raise
    try:
        if hasattr(os, 'startfile'):
            os.startfile(filename)
    except OSError:
        pass
    return jsonify({"ok": True, "file": filename})


@api.route("/cierre/balance-pdf", methods=["POST"])
def generar_cierre_balance_pdf():
    body = request.get_json()
    mes = body.get("mes")
    try:
        filename = pdf_gen.generar_pdf_balance(mes)
    except ValueError as e:
        if "NO_CIERRES_PATH" in str(e):
            return jsonify({"error": "NO_CIERRES_PATH"}), 400
        raise
    try:
        if hasattr(os, 'startfile'):
            os.startfile(filename)
    except OSError:
        pass
    return jsonify({"ok": True, "file": filename})

@api.route("/cierre/abrir-carpeta", methods=["POST"])
def abrir_carpeta_cierres():
    folder = pdf_gen.get_cierres_dir()
    if not folder:
        return jsonify({"error": "NO_CIERRES_PATH"}), 400
    try:
        if hasattr(os, 'startfile'):
            os.startfile(folder)
    except OSError:
        pass
    return jsonify({"ok": True})

@api.route("/config/cierres-path", methods=["GET"])
def get_cierres_path():
    data = dm.get_data()
    config = data.get("config", {})
    path = config.get("cierres_path", "")
    configured = bool(path and os.path.isdir(path))
    return jsonify({"path": path, "configured": configured})

@api.route("/config/cierres-path", methods=["POST"])
def set_cierres_path():
    body = request.get_json()
    path = body.get("path", "").strip()
    if not path:
        return jsonify({"error": "Path vacío"}), 400
    
    try:
        pdf_gen.setup_cierres_dir(path)
    except Exception as e:
        return jsonify({"error": f"No se pudo crear la carpeta: {e}"}), 400
    
    data = dm.get_data()
    if "config" not in data:
        data["config"] = {}
    data["config"]["cierres_path"] = path
    dm.save_data(data)
    return jsonify({"ok": True, "path": path})

@api.route("/config/cierres-path", methods=["DELETE"])
def delete_cierres_path():
    data = dm.get_data()
    if "config" in data:
        data["config"].pop("cierres_path", None)
        dm.save_data(data)
    return jsonify({"ok": True})

@api.route("/reset-dia", methods=["POST"])
def reset_dia():
    data = dm.get_data()
    today = datetime.now().strftime("%d/%m/%Y")
    data["historial"] = [p for p in data.get("historial", []) if p.get("fecha") != today]
    dm.save_data(data)
    return jsonify({"ok": True})

# ── Efectivo discount calculator ──────────────────────────────────────────────

@api.route("/calcular-efectivo", methods=["POST"])
def calcular_efectivo():
    data = dm.get_data()
    body = request.get_json()
    items = body.get("items", [])
    envio_cost = body.get("envio_cost", 0)
    tipos = data.get("producto_tipos", [])

    if items:
        disc = dm.apply_efectivo_discount_items(items, tipos) + envio_cost
    else:
        amount = body.get("amount", 0)
        disc = dm.apply_efectivo_discount(amount) + envio_cost

    return jsonify({"total_efectivo": disc})


# ── Stock ──────────────────────────────────────────────────────────────────────

@api.route("/stock", methods=["GET"])
def list_stock():
    data = dm.get_data()
    fecha = request.args.get("fecha", datetime.now().strftime("%d/%m/%Y"))
    items = [s for s in data.get("stock", []) if s.get("fecha") == fecha]
    return jsonify(items)


@api.route("/stock", methods=["POST"])
def create_stock():
    data = dm.get_data()
    body = request.get_json()

    # producto_id is required — nombre is auto-derived from the catalog
    try:
        producto_id = int(body.get("producto_id", 0))
    except (ValueError, TypeError):
        producto_id = 0
    if not producto_id:
        return jsonify({"error": "Debe seleccionar un producto"}), 400
    prod = next((p for p in data.get("catalogo", []) if p["id"] == producto_id), None)
    if not prod:
        return jsonify({"error": "Producto no encontrado"}), 404

    try:
        cantidad = float(body.get("cantidad_inicial", 0))
    except (ValueError, TypeError):
        cantidad = 0.0
    if cantidad <= 0.0:
        return jsonify({"error": "La cantidad debe ser mayor a 0"}), 400

    unidad = body.get("unidad", "unidades")
    if unidad not in ("unidades", "docenas"):
        unidad = "unidades"

    item = {
        "id": dm.next_stock_id(data),
        "fecha": body.get("fecha", datetime.now().strftime("%d/%m/%Y")),
        "nombre": prod["nombre"],
        "producto_id": producto_id,
        "var_tipo": body.get("var_tipo", ""),
        "cantidad_inicial": cantidad,
        "cantidad_actual": cantidad,
        "unidad": unidad,
    }
    data.setdefault("stock", []).append(item)
    dm.save_data(data)
    return jsonify(item), 201


@api.route("/stock/<int:sid>", methods=["PUT"])
def update_stock(sid):
    data = dm.get_data()
    body = request.get_json()
    item = next((s for s in data.get("stock", []) if s["id"] == sid), None)
    if not item:
        return jsonify({"error": "Stock no encontrado"}), 404
    # If producto_id changes, sync nombre from catalog
    if "producto_id" in body and body["producto_id"]:
        try:
            pid = int(body["producto_id"])
        except (ValueError, TypeError):
            pid = None
        if pid:
            prod = next((p for p in data.get("catalogo", []) if p["id"] == pid), None)
            if prod:
                item["producto_id"] = pid
                item["nombre"] = prod["nombre"]
    if "cantidad_inicial" in body:
        old_init = float(item.get("cantidad_inicial", 0))
        new_init = max(0.01, float(body["cantidad_inicial"]))
        item["cantidad_inicial"] = new_init
        diff = new_init - old_init
        item["cantidad_actual"] = max(0.0, float(item.get("cantidad_actual", 0)) + diff)
    if "cantidad_actual" in body:
        item["cantidad_actual"] = max(0.0, float(body["cantidad_actual"]))
    if "unidad" in body and body["unidad"] in ("unidades", "docenas"):
        item["unidad"] = body["unidad"]
    dm.save_data(data)
    return jsonify(item)


@api.route("/stock/<int:sid>", methods=["DELETE"])
def delete_stock(sid):
    data = dm.get_data()
    before = len(data.get("stock", []))
    data["stock"] = [s for s in data.get("stock", []) if s["id"] != sid]
    if len(data["stock"]) == before:
        return jsonify({"error": "Stock no encontrado"}), 404
    dm.save_data(data)
    return jsonify({"ok": True})

@api.route("/stock/carryover", methods=["POST"])
def stock_carryover():
    """Copy yesterday's leftover stock as today's starting stock."""
    data = dm.get_data()
    today = datetime.now().strftime("%d/%m/%Y")
    yesterday_dt = datetime.now() - timedelta(days=1)
    yesterday = yesterday_dt.strftime("%d/%m/%Y")

    stock = data.get("stock", [])
    today_keys = {(s["producto_id"], s.get("var_tipo", "")) for s in stock if s.get("fecha") == today}
    yesterday_items = [s for s in stock if s.get("fecha") == yesterday]

    added = 0
    for s in yesterday_items:
        pid = s["producto_id"]
        v_tipo = s.get("var_tipo", "")
        if (pid, v_tipo) in today_keys:
            continue  # already has an entry today
        leftover = s.get("cantidad_actual", 0)
        new_item = {
            "id": dm.next_stock_id(data),
            "fecha": today,
            "nombre": s["nombre"],
            "producto_id": pid,
            "var_tipo": v_tipo,
            "cantidad_inicial": leftover,
            "cantidad_actual": leftover,
            "unidad": s.get("unidad", "unidades"),
        }
        data["stock"].append(new_item)
        today_keys.add((pid, v_tipo))
        added += 1

    if added:
        dm.save_data(data)
    return jsonify({"ok": True, "added": added})


# ── Gastos ─────────────────────────────────────────────────────────────────────

@api.route("/gastos", methods=["GET"])
def list_gastos():
    data = dm.get_data()
    gastos = data.get("gastos", [])
    tipo = request.args.get("tipo", "")
    cat  = request.args.get("categoria", "")
    if tipo:
        gastos = [g for g in gastos if g.get("tipo") == tipo]
    if cat:
        gastos = [g for g in gastos if g.get("categoria") == cat]
    return jsonify(gastos)


@api.route("/gastos", methods=["POST"])
def create_gasto():
    data = dm.get_data()
    body = request.get_json()
    nombre = body.get("nombre", "").strip()
    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400
    tipo = body.get("tipo", "particular")
    if tipo not in ("fijo", "particular"):
        return jsonify({"error": "Tipo debe ser fijo o particular"}), 400
    categoria = body.get("categoria", "Bienes")
    if categoria not in ("Bienes", "Equipamiento", "Servicios"):
        return jsonify({"error": "Categoría inválida"}), 400
    try:
        monto = float(body.get("monto", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Monto inválido"}), 400
    gasto = {
        "id": dm.next_gasto_id(data),
        "nombre": nombre,
        "categoria": categoria,
        "tipo": tipo,
        "monto": monto,
        "recurrencia": body.get("recurrencia", "mensual") if tipo == "fijo" else None,
        "fecha": body.get("fecha", datetime.now().strftime("%d/%m/%Y")),
        "descripcion": body.get("descripcion", "").strip(),
        "activo": True,
    }
    data.setdefault("gastos", []).append(gasto)
    dm.save_data(data)
    return jsonify(gasto), 201


@api.route("/gastos/<int:gid>", methods=["PUT"])
def update_gasto(gid):
    data = dm.get_data()
    body = request.get_json()
    gasto = next((g for g in data.get("gastos", []) if g["id"] == gid), None)
    if not gasto:
        return jsonify({"error": "Gasto no encontrado"}), 404
    for campo in ["nombre", "categoria", "tipo", "recurrencia", "fecha", "descripcion"]:
        if campo in body:
            gasto[campo] = body[campo]
    if "monto" in body:
        try:
            gasto["monto"] = float(body["monto"])
        except (ValueError, TypeError):
            return jsonify({"error": "Monto inválido"}), 400
    if "activo" in body:
        gasto["activo"] = bool(body["activo"])
    dm.save_data(data)
    return jsonify(gasto)


@api.route("/gastos/<int:gid>", methods=["DELETE"])
def delete_gasto(gid):
    data = dm.get_data()
    before = len(data.get("gastos", []))
    data["gastos"] = [g for g in data.get("gastos", []) if g["id"] != gid]
    if len(data["gastos"]) == before:
        return jsonify({"error": "Gasto no encontrado"}), 404
    dm.save_data(data)
    return jsonify({"ok": True})


# ── Balance mensual ────────────────────────────────────────────────────────────

@api.route("/resumen/balance", methods=["GET"])
def get_balance():
    data = dm.get_data()
    mes = request.args.get("mes", datetime.now().strftime("%m/%Y"))
    try:
        mes_dt = datetime.strptime(mes, "%m/%Y")
    except Exception:
        return jsonify({"error": "Formato de mes inválido (MM/YYYY)"}), 400

    # Ingresos: pedidos Entregados o Pagos del mes
    mes_str_check = mes_dt.strftime("%m/%Y")
    historial = dm.get_all_time_pedidos(data)
    ingresos = sum(
        p.get("total", 0)
        for p in historial
        if (p.get("estado") == "Entregado" or p.get("pagado") is True)
        and "/".join(p.get("fecha", "").split("/")[1:]) == mes_str_check
    )

    total_gastos, breakdown = dm.calcular_gastos_mes(data, mes)

    return jsonify({
        "mes": mes,
        "ingresos": ingresos,
        "total_gastos": total_gastos,
        "resultado_neto": ingresos - total_gastos,
        "gastos_fijos": breakdown["fijos"],
        "gastos_particulares": breakdown["particulares"],
    })


# ── WhatsApp Evolution API Proxy ──────────────────────────────────────────────

def _evolution_api_call(method, path, body=None):
    import urllib.request
    import urllib.error
    import json
    
    data_store = dm.get_data()
    config = data_store.get("config", {})
    url = config.get("whatsapp_url", "").strip().rstrip("/")
    token = config.get("whatsapp_token", "").strip()
    
    if not url or not token:
        return {"error": "WhatsApp no configurado. Configure en Opciones."}, 400
        
    full_url = f"{url}{path}"
    headers = {
        "Content-Type": "application/json",
        "apikey": token
    }
    
    req_data = None
    if body is not None:
        req_data = json.dumps(body).encode("utf-8")
        
    req = urllib.request.Request(full_url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = response.read().decode("utf-8")
            if res_data:
                return json.loads(res_data), response.status
            return {}, response.status
    except urllib.error.HTTPError as e:
        try:
            err_data = e.read().decode("utf-8")
            return json.loads(err_data), e.code
        except Exception:
            return {"error": f"Error de API: {e.code} {e.reason}"}, e.code
    except Exception as e:
        return {"error": f"Error de conexión: {str(e)}"}, 500


@api.route("/whatsapp/status", methods=["GET"])
def whatsapp_status():
    data_store = dm.get_data()
    config = data_store.get("config", {})
    
    # Check configuration first before making any API call
    url = config.get("whatsapp_url", "").strip().rstrip("/")
    token = config.get("whatsapp_token", "").strip()
    if not url or not token:
        return jsonify({"error": "no_configurado", "message": "WhatsApp no configurado. Configure en Información."}), 400
    
    instance = config.get("whatsapp_instance", "laextra").strip()
    
    # Check connectionState
    res, status_code = _evolution_api_call("GET", f"/instance/connectionState/{instance}")
    
    # If 404, the instance doesn't exist. Try creating it.
    if status_code == 404:
        create_res, create_status = _evolution_api_call("POST", "/instance/create", {
            "instanceName": instance,
            "qrcode": True
        })
        if create_status not in (200, 201):
            return jsonify({
                "connected": False,
                "state": "close",
                "qr": None,
                "message": "Iniciando servicio de WhatsApp..."
            })
        # Re-check state
        res, status_code = _evolution_api_call("GET", f"/instance/connectionState/{instance}")
        
    if status_code != 200:
        return jsonify({
            "connected": False,
            "state": "close",
            "qr": None,
            "message": "Servicio local de WhatsApp reconectando..."
        })
        
    connection_state = res.get("instance", {}).get("state")
    
    if connection_state == "open":
        return jsonify({
            "connected": True,
            "state": connection_state
        })
    else:
        # Fetch QR code
        qr_res, qr_status = _evolution_api_call("GET", f"/instance/connect/{instance}")
        if qr_status != 200:
            return jsonify({
                "connected": False,
                "state": connection_state,
                "qr": None,
                "message": qr_res.get("error") or "Generando código QR..."
            })
            
        return jsonify({
            "connected": False,
            "state": connection_state,
            "qr": qr_res.get("base64") or qr_res.get("code")
        })


@api.route("/whatsapp/chats", methods=["GET"])
def whatsapp_chats():
    data_store = dm.get_data()
    config = data_store.get("config", {})
    instance = config.get("whatsapp_instance", "laextra").strip()
    
    res, status_code = _evolution_api_call("POST", f"/chat/findChats/{instance}", {})
    if status_code != 200:
        return jsonify({"error": "Error al buscar chats", "details": res}), status_code
        
    # Apply custom name overrides
    whatsapp_names = data_store.get("whatsapp_names", {})
    if isinstance(res, list):
        for chat in res:
            jid = chat.get("id")
            if jid in whatsapp_names:
                chat["name"] = whatsapp_names[jid]
                
    return jsonify(res)


@api.route("/whatsapp/rename", methods=["POST"])
def whatsapp_rename():
    body = request.get_json() or {}
    jid = body.get("jid")
    new_name = body.get("name", "").strip()
    
    if not jid:
        return jsonify({"error": "Se requiere el parámetro jid"}), 400
        
    data_store = dm.get_data()
    if "whatsapp_names" not in data_store:
        data_store["whatsapp_names"] = {}
        
    if new_name:
        data_store["whatsapp_names"][jid] = new_name
    else:
        # If new_name is empty, remove the override
        data_store["whatsapp_names"].pop(jid, None)
        
    dm.save_data(data_store)
    return jsonify({"success": True, "jid": jid, "name": new_name})


@api.route("/whatsapp/messages", methods=["GET"])
def whatsapp_messages():
    jid = request.args.get("jid")
    if not jid:
        return jsonify({"error": "Se requiere el parámetro jid"}), 400
        
    data_store = dm.get_data()
    config = data_store.get("config", {})
    instance = config.get("whatsapp_instance", "laextra").strip()
    
    body = {
        "where": {
            "key": {
                "remoteJid": jid
            }
        },
        "limit": 50
    }
    
    res, status_code = _evolution_api_call("POST", f"/chat/findMessages/{instance}", body)
    if status_code != 200:
        return jsonify({"error": "Error al buscar mensajes", "details": res}), status_code
        
    return jsonify(res)


@api.route("/whatsapp/send", methods=["POST"])
def whatsapp_send():
    body = request.get_json() or {}
    number = body.get("number")
    text = body.get("text")
    
    if not number or not text:
        return jsonify({"error": "Faltan parámetros 'number' o 'text'"}), 400
        
    data_store = dm.get_data()
    config = data_store.get("config", {})
    instance = config.get("whatsapp_instance", "laextra").strip()
    
    payload = {
        "number": number,
        "text": text,
        "delay": 1200,
        "linkPreview": True
    }
    
    res, status_code = _evolution_api_call("POST", f"/message/sendText/{instance}", payload)
    if status_code not in (200, 201):
        return jsonify({"error": "Error al enviar mensaje", "details": res}), status_code
        
    return jsonify(res)


@api.route("/whatsapp/download_media", methods=["GET"])
def whatsapp_download_media():
    jid = request.args.get("jid")
    msg_id = request.args.get("msgId")
    media_type = request.args.get("type")
    
    if not jid or not msg_id or not media_type:
        return jsonify({"error": "Faltan parámetros 'jid', 'msgId' o 'type'"}), 400
        
    data_store = dm.get_data()
    config = data_store.get("config", {})
    instance = config.get("whatsapp_instance", "laextra").strip()
    
    payload = {
        "jid": jid,
        "msgId": msg_id,
        "type": media_type
    }
    
    res, status_code = _evolution_api_call("POST", f"/chat/downloadMedia/{instance}", payload)
    if status_code != 200:
        return jsonify({"error": "Error al descargar multimedia", "details": res}), status_code
        
    return jsonify(res)


@api.route("/whatsapp/clear_media", methods=["POST"])
def whatsapp_clear_media():
    import os
    import shutil
    media_dir = os.path.join(api.root_path or os.path.dirname(os.path.abspath(__file__)), "static", "whatsapp_media")
    if os.path.exists(media_dir):
        try:
            for filename in os.listdir(media_dir):
                file_path = os.path.join(media_dir, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    print(f'Failed to delete {file_path}. Reason: {e}')
            return jsonify({"success": True, "message": "Carpeta whatsapp_media limpiada con éxito."})
        except Exception as e:
            return jsonify({"error": f"Error al limpiar multimedia: {str(e)}"}), 500
    return jsonify({"success": True, "message": "La carpeta no existe"})


@api.route("/borrar-datos", methods=["POST"])
def borrar_datos():
    body = request.get_json() or {}
    clear_media = body.get("clear_media", False)
    clear_catalog = body.get("clear_catalog", False)
    clear_orders = body.get("clear_orders", False)
    
    deleted_things = []
    
    if clear_media:
        import shutil
        media_dir = os.path.join(api.root_path or os.path.dirname(os.path.abspath(__file__)), "static", "whatsapp_media")
        if os.path.exists(media_dir):
            try:
                for filename in os.listdir(media_dir):
                    file_path = os.path.join(media_dir, filename)
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                deleted_things.append("multimedia_whatsapp")
            except Exception as e:
                return jsonify({"error": f"Error al limpiar multimedia WA: {str(e)}"}), 500
        else:
            deleted_things.append("multimedia_whatsapp")
            
    data = dm.get_data()
    
    if clear_catalog:
        data["catalogo"] = []
        data["stock"] = [] # Reset stock as well
        deleted_things.append("catalogo")
        
    if clear_orders:
        data["historial"] = []
        # Clear archived files in ARCHIVE_DIR
        if os.path.exists(dm.ARCHIVE_DIR):
            for fname in os.listdir(dm.ARCHIVE_DIR):
                if fname.endswith(".json"):
                    try:
                        os.unlink(os.path.join(dm.ARCHIVE_DIR, fname))
                    except Exception:
                        pass
        deleted_things.append("historial_pedidos")
        
    if clear_catalog or clear_orders:
        dm.save_data(data)
        
    return jsonify({"success": True, "deleted": deleted_things})


# ── Updates ───────────────────────────────────────────────────────────────────

@api.route("/updates/info", methods=["GET"])
def get_updates_info():
    data = dm.get_data()
    config = data.get("config", {})
    return jsonify({
        "current_version": dm.VERSION,
        "github_owner": config.get("github_owner", "JooacoMendez"),
        "github_repo": config.get("github_repo", "LaExtra-releases")
    })

@api.route("/updates/check", methods=["POST"])
def check_updates():
    try:
        import updater
        tiene_act, ultima_version, _, err = updater.chequear_actualizacion()
        if err:
            return jsonify({"error": err}), 400
        return jsonify({
            "has_update": tiene_act,
            "latest_version": ultima_version,
            "current_version": dm.VERSION
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route("/updates/install", methods=["POST"])
def install_updates():
    try:
        import updater
        success, details = updater.buscar_e_instalar_actualizacion(manual=True)
        return jsonify({"success": success, "details": details})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route("/updates/config", methods=["POST"])
def update_updates_config():
    body = request.get_json() or {}
    password = body.get("password", "")
    owner = body.get("github_owner", "").strip()
    repo = body.get("github_repo", "").strip()
    
    if not owner or not repo:
        return jsonify({"error": "Repositorio y dueño son obligatorios"}), 400
        
    try:
        import updater
        required_password = getattr(updater, "ADMIN_PASSWORD", "1234")
    except Exception:
        required_password = "1234"
        
    if password != required_password:
        return jsonify({"error": "Contraseña incorrecta"}), 403
        
    data = dm.get_data()
    if "config" not in data:
        data["config"] = {}
    data["config"]["github_owner"] = owner
    data["config"]["github_repo"] = repo
    dm.save_data(data)
    
    return jsonify({"success": True})



