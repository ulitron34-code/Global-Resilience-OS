import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 750, "GLOBAL RESILIENCE OS — Manual Maestro de Operación, Funciones e Implementación")
            self.setStrokeColor(colors.HexColor("#CBD5E0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, 50, 558, 50)
        
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(558, 35, page_str)
        self.drawString(54, 35, "CONFIDENCIAL — Global Resilience OS (2026)")
        self.restoreState()

def build_pdf(filename_e, filename_downloads):
    doc = SimpleDocTemplate(
        filename_e,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=64
    )

    styles = getSampleStyleSheet()

    # Palette
    c_primary = colors.HexColor("#0F172A")    # Dark Navy
    c_accent = colors.HexColor("#2563EB")     # Electric Blue
    c_secondary = colors.HexColor("#0284C7")  # Cyan
    c_emerald = colors.HexColor("#059669")    # Green Emerald
    c_amber = colors.HexColor("#D97706")      # Amber
    c_dark = colors.HexColor("#1E293B")       # Dark Slate
    c_body = colors.HexColor("#334155")       # Slate Body
    c_light_bg = colors.HexColor("#F8FAFC")   # Light Slate
    c_card_bg = colors.HexColor("#F1F5F9")    # Card Gray
    c_border = colors.HexColor("#E2E8F0")     # Border

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=c_primary,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_secondary,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_accent,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_body,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_body,
        leftIndent=12,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#E2E8F0"),
        borderPadding=6,
        spaceAfter=6
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E3A8A"),
        spaceAfter=6
    )

    story = []

    # Title Banner
    story.append(Paragraph("GLOBAL RESILIENCE OS", title_style))
    story.append(Paragraph("Guía Maestra Extensiva: Manual de Funciones, Operación y Hoja de Ruta de Implementación", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=0, spaceAfter=12))

    # Meta Table
    meta_data = [
        [Paragraph("<b>Plataforma:</b> Global Resilience OS", body_style), Paragraph("<b>Versión:</b> 1.0.0 Enterprise", body_style)],
        [Paragraph("<b>Estado del Sistema:</b> Producción (Render + Vercel + Supabase)", body_style), Paragraph("<b>Fecha de Actualización:</b> Agosto 2026", body_style)],
        [Paragraph("<b>Frontend Live:</b> global-resilience-os.vercel.app", body_style), Paragraph("<b>Backend Live:</b> global-resilience-os.onrender.com", body_style)]
    ]
    t_meta = Table(meta_data, colWidths=[250, 254])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # SECTION 1: VISIÓN Y ARQUITECTURA
    story.append(Paragraph("1. Visión General y Arquitectura de la Plataforma", h1_style))
    story.append(Paragraph(
        "<b>Global Resilience OS</b> es una plataforma enterprise de inteligencia de riesgo sistémico diseñada para multinacionales y cadenas críticas de suministro. Monitorea $600B USD en volumen anual de commodities distribuidas en 12 verticales industriales, identificando puntos de falla únicos (Single Points of Failure), cuellos de botella marítimos (Chokepoints) y rutas críticas de datos e hidrocarburos.",
        body_style
    ))
    story.append(Paragraph("<b>Arquitectura Tecnológica Híbrida:</b>", h2_style))
    story.append(Paragraph("• <b>Frontend (Vercel):</b> React SPA responsivo con mapas vectoriales SVG nativos a 60 FPS, aceleración por hardware y simulación gráfica sin dependencias de mapas pesados.", bullet_style))
    story.append(Paragraph("• <b>Backend (Render):</b> API REST distribuida en Node.js/Express con motores de cascada determinista de impacto, modelo de calibración cuantitativa (MAE/MAPE) y hooks para copilotos de IA.", bullet_style))
    story.append(Paragraph("• <b>Base de Datos (Supabase PostgreSQL):</b> Persistencia multi-tenant aislada mediante RLS (Row Level Security), control plane de auditoría y snapshots inmutables.", bullet_style))
    story.append(Spacer(1, 10))

    # SECTION 2: EXPLICACIÓN DETALLADA PANTALLA POR PANTALLA
    story.append(Paragraph("2. Guía Detallada de Funciones Pantalla por Pantalla", h1_style))
    story.append(Paragraph("A continuación se describe de manera explícita cada módulo, botón, filtro, gráfico e indicador dentro de la plataforma:", body_style))

    # 01 Command Center
    story.append(Paragraph("01. Command Center (Núcleo de Monitoreo Sintético)", h2_style))
    story.append(Paragraph("• <b>Barra de Contexto Superior:</b> Permite filtrar toda la analítica de la suite por <i>Vertical Industrial</i> (12 opciones disponibles: Semiconductores, Energía, Farma, Automotriz, Aeroespacial, Defensivo, Alimentos/Agro, Minería/Litio, Telecomunicaciones, Logística Marítima, Consumo Masivo, Datos/IA), <i>Región Geográfica</i> (Global, América del Norte, Asia-Pacífico, Europa, Medio Oriente, América Latina) y <i>Ventana Temporal</i> (24h, 48h, 72h, 7 días).", bullet_style))
    story.append(Paragraph("• <b>Tarjetas KPI Principales:</b><br/>"
                           "- <b>TAM ($600B):</b> Muestra el volumen anual acumulado de bienes en riesgo.<br/>"
                           "- <b>VERTICALES (12):</b> Contador de cadenas de suministro bajo monitoreo continuo.<br/>"
                           "- <b>CHOKEPOINTS (4):</b> Estado en tiempo real de Suez, Ormuz, Malaca y Bab-el-Mandeb.<br/>"
                           "- <b>EXPOSICIÓN ABIERTA ($USD):</b> Suma de pérdidas financieras potenciales de incidentes no mitigados.<br/>"
                           "- <b>ALERTAS ABIERTAS:</b> Contador de disrupciones priorizadas por nivel de severidad.<br/>"
                           "- <b>CABLES MONITOREADOS (16):</b> Rutas de fibra óptica submarina de telecomunicaciones.", bullet_style))
    story.append(Paragraph("• <b>Mapa Mundial Interactivo (Cartografía HD):</b><br/>"
                           "- <b>Silueta Continental Definida:</b> Masas terrestres sólidas en vectores SVG que dibujan con precisión a México (Baja California, Golfo, Yucatán), Norteamérica, Sudamérica, Europa, África, Asia y Oceanía.<br/>"
                           "- <b>Controles de Capas Flotantes (Top-Right):</b> Botón <code>⚡ Flujo en vivo</code> (activa partículas animadas de datos), <code>🛢️ Tuberías</code> (superpone oleoductos/gasoductos Sumed, Druzhba, TANAP, Báltico, EastMed) y <code>🛰️ Radar</code> (activa barrido giratorio 360° en Suez).<br/>"
                           "- <b>Interacción con Cables y Chokepoints:</b> Hacer clic en cualquier cable o punto rojo abre tooltips tácticos con criticidad, capacidad y puertos de amarra. Al hacer Shift+Clic se pueden seleccionar múltiples cables.", bullet_style))

    # 02 Red & Exposición
    story.append(Paragraph("02. Red & Exposición (Graph & Exposure Matrix)", h2_style))
    story.append(Paragraph("• <b>Grafo de Dependencias Multinivel:</b> Visualiza la topología interconectada entre Proveedores Tier-1, Tier-2, Nodos de Transbordo y Puertos Clave.", bullet_style))
    story.append(Paragraph("• <b>Detector de Puntos Únicos de Falla (SPOF):</b> Resalta automáticamente en color rojo brillante aquellos nodos cuya falla paralizaría a más de 3 verticales simultáneamente.", bullet_style))
    story.append(Paragraph("• <b>Matriz de Concentración Geográfica:</b> Identifica la dependencia crítica de un solo país o región en insumos clave (ej. obleas de silicio en Taiwán o gas natural en el Báltico).", bullet_style))

    # 03 Scenario Lab
    story.append(Paragraph("03. Scenario Lab (Laboratorio de Simulación Stress-Test)", h2_style))
    story.append(Paragraph("• <b>Simulaciones Preconfiguradas:</b> Botones de acceso rápido para evaluar crisis reales: <i>Bloqueo del Canal de Suez</i>, <i>Cierre del Estrecho de Ormuz</i>, <i>Sabotaje en Bab-el-Mandeb</i> y <i>Ruptura de Cables Transatlánticos</i>.", bullet_style))
    story.append(Paragraph("• <b>Panel de Parámetros Personalizados:</b> Permite ajustar manualmente la duración del evento (6h a 7 días), el porcentaje de capacidad bloqueada y el incremento en tarifas de flete.", bullet_style))
    story.append(Paragraph("• <b>Calculadora Financiera Dinámica:</b> Muestra la <b>Pérdida por Esperar</b> vs el <b>Costo de Mitigación</b> y el <b>Valor Protegido Neto</b>.", bullet_style))
    story.append(Paragraph("• <b>Evaluador de Playbooks:</b> Compare alternativas en tiempo real, tales como el <i>Desvío Marítimo por el Cabo de Buena Esperanza</i> (con visualización en mapa de la ruta verde alternativa) o la <i>Reactivación de Proveedores Secundarios en México/LATAM</i>.", bullet_style))

    # 04 Casos
    story.append(Paragraph("04. Casos (Gestión de Incidentes y Planes de Acción)", h2_style))
    story.append(Paragraph("• <b>Tabla de Gestión de Incidentes:</b> Listado de tickets activos con severidad, impacto económico estimado, asignado y tiempo transcurrido.", bullet_style))
    story.append(Paragraph("• <b>Creador de Action Plans:</b> Genera planes de mitigación paso a paso con asignación de responsables y fechas límite de ejecución.", bullet_style))
    story.append(Paragraph("• <b>Ledger Criptográfico de Auditoría:</b> Registro inmutable que sella digitalmente con hash SHA-256 cada decisión tomada, ideal para auditorías de cumplimiento o seguros.", bullet_style))

    # 05 Executive Brief
    story.append(Paragraph("05. Executive Brief (Reportes Automatizados para Alta Dirección)", h2_style))
    story.append(Paragraph("• <b>Generador de Informes C-Level:</b> Compila en 1 solo clic un informe ejecutivo de 3 párrafos listo para ser presentado ante el Comité de Administración o Inversionistas.", bullet_style))
    story.append(Paragraph("• <b>Exportador Multiformato:</b> Botones directos para descargar el reporte en Markdown, JSON estructurado o formato impreso PDF.", bullet_style))

    # 06 Operaciones
    story.append(Paragraph("06. Operaciones & Calibración (Configuración e IA)", h2_style))
    story.append(Paragraph("• <b>Monitoreo de Salud del Sistema:</b> Badge dinámico que confirma la conexión activa entre Render, Supabase y el almacenamiento de persistencia.", bullet_style))
    story.append(Paragraph("• <b>Métricas de Calibración Predictiva (MAE / MAPE):</b> Muestra la desviación absoluta media y el porcentaje de error del modelo frente a eventos históricos reales.", bullet_style))
    story.append(Paragraph("• <b>Console de Logs de Entrega de Webhooks:</b> Registro en vivo de notificaciones salientes entregadas a sistemas ERP corporativos (SAP, Oracle, Salesforce).", bullet_style))
    story.append(Paragraph("• <b>Modelo de Pricing Comercial (Suscripción del 2%):</b> Demuestra el retorno de inversión del sistema, donde la suscripción anual equivale al 2% del valor protegido en crisis (~50x ROI).", bullet_style))
    story.append(Paragraph("• <b>Conector de Copiloto IA:</b> Estado de integración con modelos de IA generativa (Claude 3.5 Sonnet / OpenAI).", bullet_style))

    story.append(Spacer(1, 10))

    # SECTION 3: GUÍA PASO A PASO LO QUE FALTA Y CÓMO HACERLO
    story.append(Paragraph("3. Hoja de Ruta: Lo Que Falta y Cómo Hacerlo Paso a Paso", h1_style))
    story.append(Paragraph("Para llevar la plataforma a un nivel comercial de escala masiva, se identifican 4 pilares fundamentales con sus instrucciones detalladas:", body_style))

    # Pilar A
    story.append(Paragraph("Pilar A: Conexión de la API de Anthropic (Claude 3.5 Sonnet)", h2_style))
    story.append(Paragraph("<b>Objetivo:</b> Activar las respuestas inteligentes en lenguaje natural para el Copiloto de Inteligencia en la pestaña de Operaciones.", body_style))
    story.append(Paragraph("<b>Instrucciones Paso a Paso:</b>", callout_style))
    story.append(Paragraph("1. Ingresa a la consola de Anthropic (<code>console.anthropic.com</code>) y genera una API Key comercial.", bullet_style))
    story.append(Paragraph("2. Inicia sesión en tu panel de control de Render (<code>dashboard.render.com</code>).", bullet_style))
    story.append(Paragraph("3. Selecciona el servicio backend llamado <b>global-resilience-os</b>.", bullet_style))
    story.append(Paragraph("4. En el menú lateral izquierdo, haz clic en <b>Environment</b>.", bullet_style))
    story.append(Paragraph("5. Haz clic en <b>Add Environment Variable</b> y agrega:<br/>"
                           "   - Key: <code>ANTHROPIC_API_KEY</code><br/>"
                           "   - Value: <code>sk-ant-api03-...</code> (tu clave de Anthropic).", bullet_style))
    story.append(Paragraph("6. Presiona <b>Save Changes</b>. Render reiniciará automáticamente el servidor en ~30 segundos.", bullet_style))
    story.append(Paragraph("7. <b>Prueba de Validación:</b> Ejecuta en terminal o Postman:<br/>"
                           "<code>curl -X POST https://global-resilience-os.onrender.com/api/copilot/chat -H \"Content-Type: application/json\" -d '{\"message\":\"Resumen de Suez\"}'</code>", code_style))

    # Pilar B
    story.append(Paragraph("Pilar B: Conexión de Feeds Marítimos y Satelitales en Tiempo Real (AIS / MarineTraffic)", h2_style))
    story.append(Paragraph("<b>Objetivo:</b> Sustituir los seeds estáticos por posiciones en vivo de buques portacontenedores y tanqueros.", body_style))
    story.append(Paragraph("<b>Instrucciones Paso a Paso:</b>", callout_style))
    story.append(Paragraph("1. Contrata un plan de datos en MarineTraffic API o Spire Maritime AIS Data API.", bullet_style))
    story.append(Paragraph("2. Agrega las credenciales <code>AIS_FEED_API_KEY</code> y <code>AIS_FEED_URL</code> en las variables de entorno de Render.", bullet_style))
    story.append(Paragraph("3. En el backend, edita el archivo <code>backend/services/feedIngestion.js</code> para mapear la latitud y longitud de los buques hacia las coordenadas del mapa.", bullet_style))
    story.append(Paragraph("4. Configura un Cron Job en Supabase mediante <code>pg_cron</code> o Render Cron para ejecutar la ingesta cada 15 minutos:<br/>"
                           "<code>node scripts/ingest-live-feeds.js</code>", code_style))

    # Pilar C
    story.append(Paragraph("Pilar C: Autenticación Multi-tenant & Pruebas RLS en Supabase Staging/Prod", h2_style))
    story.append(Paragraph("<b>Objetivo:</b> Garantizar que 2 organizaciones distintas en la plataforma nunca puedan ver los datos de la otra.", body_style))
    story.append(Paragraph("<b>Instrucciones Paso a Paso:</b>", callout_style))
    story.append(Paragraph("1. Abre el editor SQL de Supabase (<code>supabase.com/dashboard</code>).", bullet_style))
    story.append(Paragraph("2. Verifica que las 5 migraciones en <code>docs/supabase/full_schema_combined.sql</code> estén aplicadas.", bullet_style))
    story.append(Paragraph("3. Crea dos usuarios de prueba en Supabase Auth pertenecientes a dos organizaciones distintas:<br/>"
                           "   - Org A: <code>Empresa Logística Global</code> (Tenant ID: <code>fe72065f-...</code>)<br/>"
                           "   - Org B: <code>Manufactura Automotriz</code> (Tenant ID: <code>a1b2c3d4-...</code>).", bullet_style))
    story.append(Paragraph("4. Ejecuta el test de aislamiento RLS ejecutando:<br/>"
                           "<code>node scripts/test-supabase-rls-isolation.js</code>", code_style))
    story.append(Paragraph("5. Confirma que las consultas de la Org B retornen 0 filas sobre los incidentes de la Org A.", bullet_style))

    # Pilar D
    story.append(Paragraph("Pilar D: Calibración Fina con Datos Históricos del Cliente Piloto", h2_style))
    story.append(Paragraph("<b>Objetivo:</b> Adaptar las curvas de impacto predictivo a la estructura de costos real de un cliente corporativo.", body_style))
    story.append(Paragraph("<b>Instrucciones Paso a Paso:</b>", callout_style))
    story.append(Paragraph("1. Solicita al cliente un CSV con los datos históricos de órdenes de compra, tiempos de demora y penalizaciones de los últimos 24 meses.", bullet_style))
    story.append(Paragraph("2. Ingiere los datos usando el endpoint de calibración:<br/>"
                           "<code>POST /api/models/calibration/ingest</code>", code_style))
    story.append(Paragraph("3. Ejecuta el script de ajuste determinista: <code>node scripts/calibrate-model.js</code>.", bullet_style))
    story.append(Paragraph("4. Confirma en el panel de Operaciones que la métrica $MAPE$ descienda por debajo del 5% y la precisión supere el 95%.", bullet_style))

    story.append(Spacer(1, 10))

    # SECTION 4: MANUAL DE PRUEBA Y GUÍA DE DEMO
    story.append(Paragraph("4. Guía Paso a Paso para Probar la Plataforma (Demo Flow)", h1_style))
    story.append(Paragraph("Sigue esta secuencia recomendada para realizar una demostración ante inversionistas o clientes:", body_style))
    story.append(Paragraph("1. **Navegación Inicial:** Abre <code>https://global-resilience-os.vercel.app</code>. Muestra el estado del sistema en verde (<code>SISTEMA ACTIVO · NUBE</code>).", bullet_style))
    story.append(Paragraph("2. **Exploración Cartográfica:** Interactúa con los botones flotantes <code>⚡ Flujo en vivo</code>, <code>🛢️ Tuberías</code> y <code>🛰️ Radar</code>. Pasa el cursor por el mapa para mostrar las siluetas vectoriales de México, Norteamérica y Europa.", bullet_style))
    story.append(Paragraph("3. **Simulación en Tiempo Real:** En <code>Scenario Lab</code>, haz clic en <b>Bloqueo del Canal de Suez</b>. Muestra cómo la pérdida financiera asciende a $5.22B/día y cómo al cambiar el tiempo a 48h el impacto sube a $10.44B.", bullet_style))
    story.append(Paragraph("4. **Evaluación de Playbooks:** Selecciona la alternativa <i>Desvío por Cabo de Buena Esperanza</i>. Muestra la línea verde de desvío animada en el mapa y la reducción del riesgo neto.", bullet_style))
    story.append(Paragraph("5. **Generación del Reporte:** Ve a <code>Executive Brief</code> y haz clic en exportar para obtener un informe sintético para el CEO.", bullet_style))
    story.append(Paragraph("6. **Cierre Comercial:** En <code>Operaciones</code>, destaca el modelo de pricing donde el costo del software es solo el 2% del valor que protege en una sola crisis.", bullet_style))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generado exitosamente en: {filename_e}")

    # Copy to Downloads
    try:
        import shutil
        shutil.copyfile(filename_e, filename_downloads)
        print(f"Copia del PDF guardada en: {filename_downloads}")
    except Exception as e:
        print(f"No se pudo copiar a Downloads: {e}")

if __name__ == "__main__":
    file_e = r"E:\globalresilience\GUIA_MAESTRA_GLOBAL_RESILIENCE_OS.pdf"
    file_down = r"C:\Users\ulitr\Downloads\GUIA_MAESTRA_GLOBAL_RESILIENCE_OS.pdf"
    build_pdf(file_e, file_down)
