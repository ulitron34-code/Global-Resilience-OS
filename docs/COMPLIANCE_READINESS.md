# Readiness de controles

La plataforma incluye un panel de control local para distinguir capacidades
implementadas, controles parciales, datos ilustrativos y dependencias externas.
Su endpoint es `/api/compliance/readiness`.

La fase local ya incluye registro de procedencia (`/api/governance/provenance`),
revisión de retención no destructiva (`/api/governance/retention`), firmas HMAC
de webhooks y revocación de sesiones. La vista mantiene explícitamente como
externos el worker de entrega, RLS, licencias de datos y las políticas legales.

Que el panel exista no significa que el producto esté certificado. En
particular, RLS por organización, retención/borrado, fuentes licenciadas,
worker externo de webhooks y políticas legales siguen pendientes de la fase
productiva. La vista está diseñada para impedir que la demo presente esos
controles como resueltos.
