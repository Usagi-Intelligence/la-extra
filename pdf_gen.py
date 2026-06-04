"""
PDF Generation — La Extra
Minimal, monochrome daily & monthly closing reports.
"""
import os
import json
from datetime import datetime
from collections import defaultdict
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm

import data_model as dm

# ── Colors (monochrome palette) ──────────────────────────────────────────────
_BLACK   = colors.HexColor("#111111")
_DARK    = colors.HexColor("#333333")
_MID     = colors.HexColor("#666666")
_LIGHT   = colors.HexColor("#999999")
_RULE    = colors.HexColor("#cccccc")
_BG_ALT  = colors.HexColor("#f5f5f5")
_WHITE   = colors.white


# ── Helpers ──────────────────────────────────────────────────────────────────

_MESES = [
    "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]

_MESES_FOLDER = [
    "", "01-enero", "02-febrero", "03-marzo", "04-abril", "05-mayo", "06-junio",
    "07-julio", "08-agosto", "09-septiembre", "10-octubre", "11-noviembre", "12-diciembre"
]

def get_cierres_dir():
    """Return the user-configured cierres directory, or None if not set."""
    data = dm.get_data()
    config = data.get("config", {})
    path = config.get("cierres_path", "")
    if path and os.path.isdir(path):
        return path
    return None

def setup_cierres_dir(path):
    """Create the full folder structure inside the chosen path."""
    os.makedirs(path, exist_ok=True)
    diarios = os.path.join(path, "diarios")
    mensuales = os.path.join(path, "mensuales")
    os.makedirs(diarios, exist_ok=True)
    os.makedirs(mensuales, exist_ok=True)
    for m in _MESES_FOLDER[1:]:
        os.makedirs(os.path.join(diarios, m), exist_ok=True)
    return path

def _get_target_dir(dt, tipo="diario"):
    root = get_cierres_dir()
    if not root:
        raise ValueError("NO_CIERRES_PATH")
    if tipo == "diario":
        month_folder = _MESES_FOLDER[dt.month]
        target_dir = os.path.join(root, "diarios", month_folder)
    else:
        target_dir = os.path.join(root, "mensuales")
    os.makedirs(target_dir, exist_ok=True)
    return target_dir


def _money(v):
    """Format a number as Argentine-style currency."""
    return f"${v:,.0f}".replace(",", ".")


def _elapsed_str(seconds):
    if not seconds or seconds <= 0:
        return "—"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h}h {m}m"
    return f"{m}m {s}s"


def _hr():
    """Thin horizontal rule."""
    return HRFlowable(
        width="100%", thickness=0.5, color=_RULE,
        spaceBefore=8, spaceAfter=8
    )


def _styles():
    """Build the stylesheet once."""
    ss = getSampleStyleSheet()

    ss.add(ParagraphStyle(
        "brand", parent=ss["Title"],
        fontName="Helvetica-Bold", fontSize=22, leading=26,
        textColor=_BLACK, alignment=TA_CENTER, spaceAfter=2,
    ))
    ss.add(ParagraphStyle(
        "subtitle", parent=ss["Normal"],
        fontName="Helvetica", fontSize=10,
        textColor=_LIGHT, alignment=TA_CENTER, spaceAfter=14,
    ))
    ss.add(ParagraphStyle(
        "section", parent=ss["Heading2"],
        fontName="Helvetica-Bold", fontSize=11, leading=14,
        textColor=_DARK, spaceBefore=16, spaceAfter=6,
        borderPadding=(0, 0, 2, 0),
    ))
    ss.add(ParagraphStyle(
        "subsection", parent=ss["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=_MID, spaceBefore=10, spaceAfter=4,
        leftIndent=4,
    ))
    ss.add(ParagraphStyle(
        "body", parent=ss["Normal"],
        fontName="Helvetica", fontSize=9, leading=12,
        textColor=_DARK,
    ))
    ss.add(ParagraphStyle(
        "bodyRight", parent=ss["Normal"],
        fontName="Helvetica", fontSize=9, leading=12,
        textColor=_DARK, alignment=TA_RIGHT,
    ))
    ss.add(ParagraphStyle(
        "bodyBold", parent=ss["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=_BLACK,
    ))
    ss.add(ParagraphStyle(
        "warningText", parent=ss["Normal"],
        fontName="Helvetica-Bold", fontSize=8.5, leading=11,
        textColor=colors.HexColor("#b91c1c"),  # premium dark red
        alignment=TA_CENTER, spaceBefore=4, spaceAfter=8,
    ))
    ss.add(ParagraphStyle(
        "bigNumber", parent=ss["Normal"],
        fontName="Helvetica-Bold", fontSize=16, leading=20,
        textColor=_BLACK, alignment=TA_CENTER,
    ))
    ss.add(ParagraphStyle(
        "footer", parent=ss["Normal"],
        fontName="Helvetica", fontSize=7,
        textColor=_LIGHT, alignment=TA_CENTER, spaceBefore=20,
    ))
    ss.add(ParagraphStyle(
        "items_cell", parent=ss["Normal"],
        fontName="Helvetica", fontSize=8, leading=10,
        textColor=_DARK,
    ))
    ss.add(ParagraphStyle(
        "items_cell_pending", parent=ss["Normal"],
        fontName="Helvetica-Bold", fontSize=8, leading=10,
        textColor=colors.HexColor("#b91c1c"),
    ))
    return ss


# ── Table styles ─────────────────────────────────────────────────────────────

_TS_CLEAN = TableStyle([
    # Global
    ("FONTNAME",    (0, 0), (-1, -1), "Helvetica"),
    ("FONTSIZE",    (0, 0), (-1, -1), 9),
    ("TEXTCOLOR",   (0, 0), (-1, -1), _DARK),
    ("TOPPADDING",  (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    # Header row
    ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE",    (0, 0), (-1, 0), 8),
    ("TEXTCOLOR",   (0, 0), (-1, 0), _LIGHT),
    ("LINEBELOW",   (0, 0), (-1, 0), 0.5, _RULE),
    # Alternating rows
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_WHITE, _BG_ALT]),
])


# ── Daily report ─────────────────────────────────────────────────────────────

def generar_pdf_diario(fecha_str):
    try:
        dt = datetime.strptime(fecha_str, "%d/%m/%Y")
    except Exception:
        dt = datetime.now()
        fecha_str = dt.strftime("%d/%m/%Y")
        
    diarios_dir = _get_target_dir(dt, "diario")
    filename_date = dt.strftime("%d-%m-%Y")
    title_date = f"{dt.day} de {_MESES[dt.month]} de {dt.year}"

    filename = os.path.join(diarios_dir, f"{filename_date}.pdf")

    data = dm.get_data()
    todos = [p for p in data.get("historial", []) if p.get("fecha") == fecha_str]
    if not todos:
        # Fallback 1: Try daily archive
        try:
            fname = dt.strftime("%Y-%m-%d") + ".json"
            fpath = os.path.join(dm.ARCHIVE_DIR, fname)
            if os.path.exists(fpath):
                with open(fpath, "r", encoding="utf-8") as f:
                    todos = json.load(f)
        except Exception:
            pass

        # Fallback 2: Try yearly archive
        if not todos:
            try:
                year_str = str(dt.year)
                fpath = os.path.join(dm.ARCHIVE_DIR, f"historial_{year_str}.json")
                if os.path.exists(fpath):
                    with open(fpath, "r", encoding="utf-8") as f:
                        yearly_pedidos = json.load(f)
                    todos = [p for p in yearly_pedidos if p.get("fecha") == fecha_str]
            except Exception:
                pass
    entregados = [p for p in todos if p.get("estado") == "Entregado"]
    pendientes = [p for p in todos if p.get("estado") in ("En curso", "Listo")]

    config = data.get("config", {})
    nombre_negocio = config.get("nombre_negocio", "La Extra")

    # Margins: 2cm
    doc = SimpleDocTemplate(
        filename, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    ss = _styles()
    el = []  # elements

    # ── Header ────────────────────────────────────────────────────────────
    el.append(Paragraph(nombre_negocio.upper(), ss["brand"]))
    el.append(Paragraph(f"Cierre diario · {title_date}", ss["subtitle"]))
    if pendientes:
        pl = "pedidos pendientes" if len(pendientes) > 1 else "pedido pendiente"
        el.append(Paragraph(f"⚠ Hay {len(pendientes)} {pl} sin entregar (no incluidos en la facturación y promedio).", ss["warningText"]))
    el.append(_hr())

    if not todos:
        el.append(Spacer(1, 20))
        el.append(Paragraph("No se registraron pedidos en esta fecha.", ss["body"]))
        doc.build(el)
        return filename

    # ── Metrics ───────────────────────────────────────────────────────────
    total_efectivo = 0
    total_digital = 0
    total_otros = 0
    total_bruto = 0
    total_descuentos = 0
    total_envio_casa = 0    # House pays → pure expense
    total_envio_cliente = 0  # Client pays → income in, expense out (net 0)
    ventas_por_tipo = defaultdict(lambda: defaultdict(int))
    metodos_count = defaultdict(int)

    for p in entregados:
        subtotal = p.get("subtotal", 0) or p.get("total", 0)
        total_bruto += subtotal
        total_descuentos += p.get("descuento", 0)

        envio = p.get("envio", {})
        if envio.get("envio"):
            costo = float(envio.get("costo_envio", 0) or 0)
            if envio.get("cliente_paga_envio"):
                total_envio_cliente += costo
            else:
                total_envio_casa += costo

        metodo = p.get("pago", {}).get("metodo", "Mixto")
        metodos_count[metodo] += 1

        monto = p.get("total", 0)
        if metodo == "Efectivo":
            total_efectivo += p.get("pago", {}).get("total_efectivo") or monto
        elif metodo == "Transferencia":
            total_digital += monto
        else:
            total_otros += monto

        for item in p.get("items", []):
            tipo_name = item.get("tipo", "Otros").capitalize()
            nombre = item.get("nombre", "?")
            if item.get("var_cantidad"):
                clean_vc = dm.clean_variant_name(item["var_cantidad"])
                if clean_vc:
                    nombre += f" ({clean_vc})"
            if item.get("var_tipo"):
                nombre += f" · {item['var_tipo']}"
            ventas_por_tipo[tipo_name][nombre] += item.get("cantidad", 1)

    total_neto = total_efectivo + total_digital + total_otros
    
    # Precise shipping math
    ingreso_real = total_neto - total_envio_cliente - total_envio_casa

    tiempos = [p["elapsed"] for p in entregados if p.get("elapsed") is not None and p["elapsed"] > 0]
    promedio_prep = sum(tiempos) / len(tiempos) if tiempos else 0

    # ── Overview cards (as a 3-column table) ──────────────────────────────
    card_data = [[
        Paragraph("PEDIDOS", ss["subtitle"]),
        Paragraph("FACTURACIÓN", ss["subtitle"]),
        Paragraph("TIEMPO PROM.", ss["subtitle"]),
    ], [
        Paragraph(str(len(todos)), ss["bigNumber"]),
        Paragraph(_money(ingreso_real), ss["bigNumber"]),
        Paragraph(_elapsed_str(promedio_prep), ss["bigNumber"]),
    ]]

    w = (A4[0] - 4*cm) / 3
    t_cards = Table(card_data, colWidths=[w, w, w])
    t_cards.setStyle(TableStyle([
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",  (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEAFTER",   (0, 0), (1, -1), 0.5, _RULE),
    ]))
    el.append(t_cards)
    el.append(Spacer(1, 6))
    el.append(_hr())

    # ── Financial breakdown ───────────────────────────────────────────────
    el.append(Paragraph("DESGLOSE FINANCIERO", ss["section"]))

    fin_rows = []
    if total_envio_cliente > 0:
        fin_rows.append(["Envío (paga cliente)", f"– {_money(total_envio_cliente)}"])
    if total_envio_casa > 0:
        fin_rows.append(["Envío (paga la casa)", f"– {_money(total_envio_casa)}"])
    if fin_rows:
        fin_rows.append(["", ""])

    fin_rows += [
        ["Efectivo", _money(total_efectivo)],
        ["Digital (Transferencia)", _money(total_digital)],
        ["Mixto / Otro", _money(total_otros)],
    ]

    col_w = [(A4[0] - 4*cm) * 0.65, (A4[0] - 4*cm) * 0.35]
    t_fin = Table(fin_rows, colWidths=col_w)
    t_fin.setStyle(TableStyle([
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 0), (0, -1),  _DARK),
        ("TEXTCOLOR",     (1, 0), (1, -1),  _BLACK),
        ("ALIGN",         (1, 0), (1, -1),  "RIGHT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
    ]))
    el.append(t_fin)
    el.append(Spacer(1, 4))
    el.append(_hr())

    # ── Products sold (grouped by type) ────────────────────────────────────
    if ventas_por_tipo:
        el.append(Paragraph("PRODUCTOS VENDIDOS", ss["section"]))

        for tipo_name in sorted(ventas_por_tipo.keys()):
            productos = ventas_por_tipo[tipo_name]
            total_tipo = sum(productos.values())
            el.append(Paragraph(f"{tipo_name}  —  {total_tipo} unid.", ss["subsection"]))

            prod_rows = [["Producto", "Cant."]]
            for nombre, cant in sorted(productos.items(), key=lambda x: x[1], reverse=True):
                prod_rows.append([nombre, str(cant)])

            t_prod = Table(prod_rows, colWidths=[(A4[0] - 4*cm) * 0.80, (A4[0] - 4*cm) * 0.20])
            t_prod.setStyle(_TS_CLEAN)
            t_prod.setStyle(TableStyle([
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ]))
            el.append(t_prod)
            el.append(Spacer(1, 4))

        el.append(_hr())

    # ── Order list ────────────────────────────────────────────────────────
    el.append(Paragraph("DETALLE DE PEDIDOS", ss["section"]))

    order_rows = [["#", "Cliente", "Hora", "Items", "Total", "Pago", "Estado"]]
    not_delivered_row_indices = []
    for p in todos:
        is_pending = p.get("estado") in ("En curso", "Listo")
        
        items_parts = []
        for it in p.get("items", []):
            name = f"{it.get('cantidad', 1)}x {it.get('nombre', '?')}"
            variants = []
            if it.get("var_cantidad"):
                clean_vc = dm.clean_variant_name(it["var_cantidad"])
                if clean_vc:
                    variants.append(clean_vc)
            if it.get("var_tipo"):
                variants.append(it["var_tipo"])
            if variants:
                name += f' <font color="#999999">({" · ".join(variants)})</font>'
            items_parts.append(name)
        
        style_name = "items_cell_pending" if is_pending else "items_cell"
        items_para = Paragraph(
            ", ".join(items_parts),
            ss[style_name]
        )

        estado_raw = p.get("estado", "—")
        if estado_raw == "En curso":
            estado_lbl = "EN CURSO"
        elif estado_raw == "Listo":
            estado_lbl = "LISTO"
        elif estado_raw == "Entregado":
            estado_lbl = "ENTREGADO"
        else:
            estado_lbl = estado_raw.upper()

        order_rows.append([
            str(p.get("id", "")),
            p.get("cliente", "—"),
            p.get("hora_registro", "—"),
            items_para,
            _money(p.get("total", 0)),
            p.get("pago", {}).get("metodo", "—")[:6],
            estado_lbl,
        ])
        
        if is_pending:
            not_delivered_row_indices.append(len(order_rows) - 1)

    t_orders = Table(
        order_rows,
        colWidths=[
            0.06 * (A4[0] - 4*cm),
            0.15 * (A4[0] - 4*cm),
            0.09 * (A4[0] - 4*cm),
            0.38 * (A4[0] - 4*cm),
            0.11 * (A4[0] - 4*cm),
            0.11 * (A4[0] - 4*cm),
            0.10 * (A4[0] - 4*cm),
        ]
    )
    t_orders.setStyle(_TS_CLEAN)
    
    custom_style = [
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (4, 0), (4, -1), "RIGHT"),
        ("ALIGN", (5, 0), (5, -1), "CENTER"),
        ("ALIGN", (6, 0), (6, -1), "CENTER"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
    ]
    for r_idx in not_delivered_row_indices:
        custom_style.append(("TEXTCOLOR", (0, r_idx), (-1, r_idx), colors.HexColor("#b91c1c")))
        custom_style.append(("FONTNAME", (0, r_idx), (-1, r_idx), "Helvetica-Bold"))
        
    t_orders.setStyle(TableStyle(custom_style))
    el.append(t_orders)

    # ── Footer ────────────────────────────────────────────────────────────
    el.append(Spacer(1, 20))
    el.append(_hr())
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    el.append(Paragraph(
        f"Generado automáticamente por {nombre_negocio} · {now_str}",
        ss["footer"]
    ))

    doc.build(el)
    return filename


# ── Monthly report ───────────────────────────────────────────────────────────

def generar_pdf_mensual(mes_str):
    # mes_str is "MM/YYYY"
    try:
        dt = datetime.strptime(mes_str, "%m/%Y")
    except Exception:
        dt = datetime.now()
        mes_str = dt.strftime("%m/%Y")

    mensuales_dir = _get_target_dir(dt, "mensual")
    filename_date = dt.strftime("%m-%Y")
    filename = os.path.join(mensuales_dir, f"{filename_date}.pdf")

    data = dm.get_data()
    pedidos_mes = [
        p for p in data.get("historial", [])
        if "/".join(p.get("fecha", "").split("/")[1:]) == mes_str
    ]
    try:
        year_str = mes_str.split("/")[1]
        archive_path = os.path.join(dm.ARCHIVE_DIR, f"historial_{year_str}.json")
        if os.path.exists(archive_path):
            with open(archive_path, "r", encoding="utf-8") as f:
                archived = json.load(f)
            existing_ids = {p["id"] for p in pedidos_mes}
            for p in archived:
                if "/".join(p.get("fecha", "").split("/")[1:]) == mes_str and p["id"] not in existing_ids:
                    pedidos_mes.append(p)
    except Exception:
        pass
    
    entregados = [p for p in pedidos_mes if p.get("estado") == "Entregado" or p.get("pagado") is True]
    pendientes = [p for p in pedidos_mes if p.get("estado") in ("En curso", "Listo") and p.get("pagado") is not True]

    config = data.get("config", {})
    nombre_negocio = config.get("nombre_negocio", "La Extra")

    meses_nombre = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    try:
        mes_display = f"{meses_nombre[dt.month]} {dt.year}"
    except Exception:
        mes_display = mes_str

    doc = SimpleDocTemplate(
        filename, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    ss = _styles()
    el = []

    # Header
    el.append(Paragraph(nombre_negocio.upper(), ss["brand"]))
    el.append(Paragraph(f"Resumen mensual · {mes_display}", ss["subtitle"]))
    if pendientes:
        pl = "pedidos pendientes" if len(pendientes) > 1 else "pedido pendiente"
        el.append(Paragraph(f"⚠ Hay {len(pendientes)} {pl} sin entregar en este período (no incluidos en la facturación y promedio).", ss["warningText"]))
    el.append(_hr())

    if not pedidos_mes:
        el.append(Spacer(1, 20))
        el.append(Paragraph("No hay pedidos registrados para este mes.", ss["body"]))
        doc.build(el)
        return filename

    # Financial metrics
    total_bruto = 0
    total_descuentos = 0
    total_envio_casa = 0
    total_envio_cliente = 0
    total_efectivo = 0
    total_digital = 0
    total_otros = 0
    # ventas_por_tipo will map: category -> product_name -> {"cantidad": int, "ingreso": float}
    ventas_por_tipo = defaultdict(lambda: defaultdict(lambda: {"cantidad": 0, "ingreso": 0.0}))

    for p in entregados:
        subtotal = p.get("subtotal", 0) or p.get("total", 0)
        total_bruto += subtotal
        total_descuentos += p.get("descuento", 0)

        envio = p.get("envio", {})
        if envio.get("envio"):
            costo = float(envio.get("costo_envio", 0) or 0)
            if envio.get("cliente_paga_envio"):
                total_envio_cliente += costo
            else:
                total_envio_casa += costo

        metodo = p.get("pago", {}).get("metodo", "Mixto")
        monto = p.get("total", 0)
        if metodo == "Efectivo":
            total_efectivo += p.get("pago", {}).get("total_efectivo") or monto
        elif metodo == "Transferencia":
            total_digital += monto
        else:
            total_otros += monto

        for item in p.get("items", []):
            tipo_name = item.get("tipo", "Otros").capitalize()
            nombre = item.get("nombre", "?")
            if item.get("var_cantidad"):
                clean_vc = dm.clean_variant_name(item["var_cantidad"])
                if clean_vc:
                    nombre += f" ({clean_vc})"
            if item.get("var_tipo"):
                nombre += f" · {item['var_tipo']}"
            
            cant = item.get("cantidad", 1)
            precio = float(item.get("precio", 0) or 0)
            ventas_por_tipo[tipo_name][nombre]["cantidad"] += cant
            ventas_por_tipo[tipo_name][nombre]["ingreso"] += cant * precio

    total_neto = total_efectivo + total_digital + total_otros
    ingreso_real = total_neto - total_envio_cliente - total_envio_casa
    promedio = ingreso_real / len(entregados) if entregados else 0

    total_gastos, breakdown = dm.calcular_gastos_mes(data, mes_str)
    neto = ingreso_real - total_gastos

    # Overview cards (now 4 columns: PEDIDOS, INGRESOS, GASTOS, NETO)
    card_data = [[
        Paragraph("PEDIDOS", ss["subtitle"]),
        Paragraph("INGRESOS", ss["subtitle"]),
        Paragraph("GASTOS", ss["subtitle"]),
        Paragraph("NETO", ss["subtitle"]),
    ], [
        Paragraph(str(len(entregados)), ss["bigNumber"]),
        Paragraph(_money(ingreso_real), ss["bigNumber"]),
        Paragraph(_money(total_gastos), ss["bigNumber"]),
        Paragraph((f"+" if neto >= 0 else "") + _money(neto), ss["bigNumber"]),
    ]]

    w = (A4[0] - 4*cm) / 4
    t_cards = Table(card_data, colWidths=[w, w, w, w])
    t_cards.setStyle(TableStyle([
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",  (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEAFTER",   (0, 0), (2, -1), 0.5, _RULE),
    ]))
    el.append(t_cards)
    el.append(Spacer(1, 6))
    el.append(_hr())

    # Financial breakdown
    el.append(Paragraph("DESGLOSE FINANCIERO", ss["section"]))

    fin_rows = []
    if total_envio_cliente > 0:
        fin_rows.append(["Envío (paga cliente)", f"– {_money(total_envio_cliente)}"])
    if total_envio_casa > 0:
        fin_rows.append(["Envío (paga la casa)", f"– {_money(total_envio_casa)}"])
    if fin_rows:
        fin_rows.append(["", ""])

    fin_rows += [
        ["Efectivo", _money(total_efectivo)],
        ["Digital (Transferencia)", _money(total_digital)],
        ["Mixto / Otro", _money(total_otros)],
    ]

    col_w = [(A4[0] - 4*cm) * 0.65, (A4[0] - 4*cm) * 0.35]
    t_fin = Table(fin_rows, colWidths=col_w)
    t_fin.setStyle(TableStyle([
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 0), (0, -1),  _DARK),
        ("TEXTCOLOR",     (1, 0), (1, -1),  _BLACK),
        ("ALIGN",         (1, 0), (1, -1),  "RIGHT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
    ]))
    el.append(t_fin)
    el.append(Spacer(1, 4))
    el.append(_hr())

    # Expenses details (separate fixed and particular)
    el.append(Paragraph("DETALLE DE GASTOS", ss["section"]))

    # Fixed Expenses
    el.append(Paragraph("Gastos Fijos", ss["subsection"]))
    fijos_list = breakdown.get("fijos", [])
    if not fijos_list:
        el.append(Paragraph("No hay gastos fijos registrados en este período.", ss["body"]))
    else:
        fijos_rows = [["Concepto", "Recurrencia", "Monto Mensual"]]
        for f in fijos_list:
            rec = f.get("recurrencia", "1_meses").replace("_", " ")
            fijos_rows.append([f.get("nombre", "—"), rec, _money(f.get("monto_mensual", 0))])
        
        t_fijos = Table(fijos_rows, colWidths=[(A4[0] - 4*cm) * 0.50, (A4[0] - 4*cm) * 0.25, (A4[0] - 4*cm) * 0.25])
        t_fijos.setStyle(_TS_CLEAN)
        t_fijos.setStyle(TableStyle([
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ]))
        el.append(t_fijos)

    el.append(Spacer(1, 10))

    # Particular Expenses
    el.append(Paragraph("Gastos Particulares", ss["subsection"]))
    part_list = breakdown.get("particulares", [])
    if not part_list:
        el.append(Paragraph("No hay gastos particulares registrados en este período.", ss["body"]))
    else:
        part_rows = [["Concepto", "Fecha", "Monto"]]
        for p in part_list:
            part_rows.append([p.get("nombre", "—"), p.get("fecha", "—"), _money(p.get("monto", 0))])
        
        t_part = Table(part_rows, colWidths=[(A4[0] - 4*cm) * 0.50, (A4[0] - 4*cm) * 0.25, (A4[0] - 4*cm) * 0.25])
        t_part.setStyle(_TS_CLEAN)
        t_part.setStyle(TableStyle([
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ]))
        el.append(t_part)

    el.append(Spacer(1, 10))
    el.append(_hr())

    # Products by type
    if ventas_por_tipo:
        el.append(Paragraph("PRODUCTOS VENDIDOS", ss["section"]))

        for tipo_name in sorted(ventas_por_tipo.keys()):
            productos = ventas_por_tipo[tipo_name]
            total_tipo = sum(p_info["cantidad"] for p_info in productos.values())
            el.append(Paragraph(f"{tipo_name}  —  {total_tipo} unid.", ss["subsection"]))

            prod_rows = [["Producto", "Cant.", "Ingreso"]]
            for nombre, info in sorted(productos.items(), key=lambda x: x[1]["cantidad"], reverse=True):
                prod_rows.append([nombre, str(info["cantidad"]), _money(info["ingreso"])])

            t_prod = Table(prod_rows, colWidths=[(A4[0] - 4*cm) * 0.60, (A4[0] - 4*cm) * 0.15, (A4[0] - 4*cm) * 0.25])
            t_prod.setStyle(_TS_CLEAN)
            t_prod.setStyle(TableStyle([
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
                ("ALIGN", (2, 0), (2, -1), "RIGHT"),
            ]))
            el.append(t_prod)
            el.append(Spacer(1, 4))

        el.append(_hr())

    # Daily breakdown
    el.append(Paragraph("DESGLOSE POR DÍA", ss["section"]))
    dias = defaultdict(lambda: {"pedidos": 0, "total": 0})
    for p in entregados:
        fecha = p.get("fecha", "?")
        dias[fecha]["pedidos"] += 1
        
        metodo = p.get("pago", {}).get("metodo", "Mixto")
        monto = p.get("pago", {}).get("total_efectivo") if metodo == "Efectivo" else p.get("total", 0)
        envio = p.get("envio", {})
        costo = float(envio.get("costo_envio", 0) or 0) if envio.get("envio") else 0
        neto = monto - costo
        dias[fecha]["total"] += neto

    day_rows = [["Fecha", "Pedidos", "Total"]]
    for fecha in sorted(dias.keys()):
        d = dias[fecha]
        day_rows.append([fecha, str(d["pedidos"]), _money(d["total"])])

    t_days = Table(day_rows, colWidths=[
        (A4[0] - 5*cm) * 0.40,
        (A4[0] - 5*cm) * 0.25,
        (A4[0] - 5*cm) * 0.35,
    ])
    t_days.setStyle(_TS_CLEAN)
    t_days.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
    ]))
    el.append(t_days)

    # Footer
    el.append(Spacer(1, 20))
    el.append(_hr())
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    el.append(Paragraph(
        f"Generado automáticamente por {nombre_negocio} · {now_str}",
        ss["footer"]
    ))

    doc.build(el)
    return filename


def generar_pdf_balance(mes_str):
    try:
        dt = datetime.strptime(mes_str, "%m/%Y")
    except Exception:
        dt = datetime.now()
        mes_str = dt.strftime("%m/%Y")

    mensuales_dir = _get_target_dir(dt, "mensual")
    filename_date = dt.strftime("balance-%m-%Y")
    filename = os.path.join(mensuales_dir, f"{filename_date}.pdf")

    data = dm.get_data()
    
    # Calculate incomes
    historial = dm.get_all_time_pedidos(data)
    ingresos = sum(
        p.get("total", 0)
        for p in historial
        if (p.get("estado") == "Entregado" or p.get("pagado") is True)
        and "/".join(p.get("fecha", "").split("/")[1:]) == mes_str
    )

    total_gastos, breakdown = dm.calcular_gastos_mes(data, mes_str)
    neto = ingresos - total_gastos

    config = data.get("config", {})
    nombre_negocio = config.get("nombre_negocio", "La Extra")

    meses_nombre = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    try:
        mes_display = f"{meses_nombre[dt.month]} {dt.year}"
    except Exception:
        mes_display = mes_str

    doc = SimpleDocTemplate(
        filename, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    ss = _styles()
    el = []

    # Header
    el.append(Paragraph(nombre_negocio.upper(), ss["brand"]))
    el.append(Paragraph(f"Balance mensual · {mes_display}", ss["subtitle"]))
    el.append(_hr())

    # Overview Metrics Table
    card_data = [[
        Paragraph("INGRESOS", ss["subtitle"]),
        Paragraph("GASTOS", ss["subtitle"]),
        Paragraph("RESULTADO NETO", ss["subtitle"]),
    ], [
        Paragraph(_money(ingresos), ss["bigNumber"]),
        Paragraph(_money(total_gastos), ss["bigNumber"]),
        Paragraph((f"+" if neto >= 0 else "") + _money(neto), ss["bigNumber"]),
    ]]

    w = (A4[0] - 4*cm) / 3
    t_cards = Table(card_data, colWidths=[w, w, w])
    t_cards.setStyle(TableStyle([
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",  (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEAFTER",   (0, 0), (1, -1), 0.5, _RULE),
    ]))
    el.append(t_cards)
    el.append(Spacer(1, 6))
    el.append(_hr())

    # Expenses details (separate fixed and particular)
    el.append(Paragraph("DETALLE DE GASTOS", ss["section"]))

    # Fixed Expenses
    el.append(Paragraph("Gastos Fijos", ss["subsection"]))
    fijos_list = breakdown.get("fijos", [])
    if not fijos_list:
        el.append(Paragraph("No hay gastos fijos registrados en este período.", ss["body"]))
    else:
        fijos_rows = [["Concepto", "Recurrencia", "Monto Mensual"]]
        for f in fijos_list:
            rec = f.get("recurrencia", "1_meses").replace("_", " ")
            fijos_rows.append([f.get("nombre", "—"), rec, _money(f.get("monto_mensual", 0))])
        
        t_fijos = Table(fijos_rows, colWidths=[(A4[0] - 4*cm) * 0.50, (A4[0] - 4*cm) * 0.25, (A4[0] - 4*cm) * 0.25])
        t_fijos.setStyle(_TS_CLEAN)
        t_fijos.setStyle(TableStyle([
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ]))
        el.append(t_fijos)

    el.append(Spacer(1, 10))

    # Particular Expenses
    el.append(Paragraph("Gastos Particulares", ss["subsection"]))
    part_list = breakdown.get("particulares", [])
    if not part_list:
        el.append(Paragraph("No hay gastos particulares registrados en este período.", ss["body"]))
    else:
        part_rows = [["Concepto", "Fecha", "Monto"]]
        for p in part_list:
            part_rows.append([p.get("nombre", "—"), p.get("fecha", "—"), _money(p.get("monto", 0))])
        
        t_part = Table(part_rows, colWidths=[(A4[0] - 4*cm) * 0.50, (A4[0] - 4*cm) * 0.25, (A4[0] - 4*cm) * 0.25])
        t_part.setStyle(_TS_CLEAN)
        t_part.setStyle(TableStyle([
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ]))
        el.append(t_part)

    # Footer
    el.append(Spacer(1, 20))
    el.append(_hr())
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    el.append(Paragraph(
        f"Generado automáticamente por {nombre_negocio} · {now_str}",
        ss["footer"]
    ))

    doc.build(el)
    return filename
