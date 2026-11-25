Documento consolidado de ADR
Control electoral para una organización política. Ionic Angular Standalone y Supabase.
Equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Fecha de la reunión: 2026-11-22
El equipo acordó una línea base común con seis decisiones. Todas están en estado Aceptado.
ADR	Decisión	Minuto del video
ADR-001	Ionic Angular Standalone como framework móvil	00:02:05
ADR-002	Arquitectura por capas para páginas, componentes, servicios, modelos y acceso a datos	00:02:34 a 00:05:34
ADR-003	Plugins oficiales de Capacitor para cámara y geolocalización	00:18:22
ADR-004	Supabase como backend (Auth, PostgreSQL con RLS, Storage y Edge Functions)	00:10:11 a 00:14:41
ADR-005	Estado híbrido (Signals y RxJS), formularios reactivos, validaciones y manejo global de errores	00:05:34 a 00:10:11
ADR-006	Cola offline con @capacitor-community/sqlite y resolución de conflictos	00:20:27 a 00:23:02
 
ADR-001: Ionic Angular Standalone como framework móvil
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R1 a R9: el framework debe soportar todas las funciones de la app: gestión electoral, autenticación, actas, cámara, GPS, navegación y resultados.
•	R7: integración con Capacitor para cámara y geolocalización.
•	R9: separación de presentación, lógica de negocio y acceso a datos.
Contexto
Hay que elegir un solo framework para los tres integrantes. Debe manejar páginas, componentes, servicios, formularios y navegación, y compilar para Android con Capacitor.
Alternativas consideradas
Alternativa 1: Ionic Angular Standalone
Ventajas:
•	Organiza el proyecto en componentes, páginas y servicios.
•	Incluye Angular Router y Reactive Forms.
•	Se integra con Capacitor y Supabase mediante servicios.
•	El equipo ya tiene experiencia con Angular e Ionic.
Desventajas:
•	Hay que entender los componentes standalone y sus importaciones.
•	Integrar varias dependencias puede complicar la configuración.
•	Sin una estructura clara, la lógica termina en los componentes.
Alternativa 2: Ionic React
Ventajas:
•	Componentes reutilizables y hooks para el estado.
•	React Router para la navegación.
•	Se integra con Capacitor.
•	El equipo conoce React.
Desventajas:
•	La arquitectura se organiza a mano.
•	Formularios y validaciones requieren bibliotecas adicionales.
•	El equipo tiene más experiencia con Ionic Angular.
Decisión
Se usa Ionic Angular Standalone por la experiencia previa del equipo con Angular e Ionic. La app usará componentes standalone, servicios para la lógica de negocio, Angular Router, Reactive Forms y Capacitor para las funciones nativas.
Consecuencias
Beneficios:
•	Se aprovecha lo que el equipo ya sabe.
•	Navegación y validación de formularios vienen integradas.
•	La integración con Supabase y Capacitor es directa.
Limitaciones:
•	Los tres integrantes deben respetar la misma estructura.
Riesgo identificado:
•	Una mala configuración de los componentes standalone o de las dependencias de Ionic puede causar errores de compilación.
Verificación
1.	Crear el proyecto con Ionic Angular Standalone y ejecutarlo con ionic serve.
2.	Crear varias páginas y probar la navegación entre ellas.
3.	Probar un formulario con Reactive Forms y sus validaciones.
4.	Compilar para Android con Capacitor.
5.	Comprobar que los tres integrantes ejecutan la estructura acordada.
Comandos de referencia:
ionic serve
ionic build
npx cap add android
npx cap sync android
npx cap open android

Consenso del equipo
Acuerdo final: Ionic Angular Standalone.
Minuto del video: 00:02:05
 
ADR-002: Arquitectura por capas para páginas, componentes, servicios, modelos y acceso a datos
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R9: separación de presentación, lógica y acceso a datos, con estados de carga, éxito, error y validación.
•	R4, R5 y R6: pantallas distintas por rol, protegidas con guards.
•	R8: las reglas de acceso se aplican en el backend.
•	R10: la cola offline debe ubicarse entre la lógica y los datos sin tocar las páginas.
Contexto
R9 exige separar presentación, lógica y acceso a datos, y los tres integrantes deben usar la misma estructura. Los tres roles comparten el mismo dominio: recintos, JRV, actas y usuarios.
Alternativas consideradas
Alternativa 1: Capas técnicas con repositorios como único acceso a datos
Ventajas:
•	Cada capa tiene su propia carpeta.
•	Solo los repositorios conocen Supabase.
•	La cola offline se ubica entre servicios y repositorios.
Desventajas:
•	Genera más archivos.
•	Los servicios crecen si no se dividen por dominio.
Alternativa 2: Organización por funcionalidad (features)
Ventajas:
•	Todo lo de un tema queda en la misma carpeta.
•	Escala bien en proyectos grandes.
Desventajas:
•	Las capas se mezclan dentro de cada carpeta.
•	Cada integrante podría organizarlo distinto.
Alternativa 3: Servicios con acceso directo a Supabase
Ventajas:
•	Menos archivos y arranque más rápido.
Desventajas:
•	Mezcla lógica y datos, lo que incumple R9.
•	Complica el modo offline.
Decisión
Se usa la separación por capas técnicas. Las páginas muestran datos y capturan acciones, los servicios tienen la lógica y el estado, los repositorios son la única capa que habla con Supabase y los guards controlan el acceso por rol. Los servicios se dividen por dominio: actas, recintos y usuarios.
Estructura de carpetas:
src/app/core/models: interfaces Recinto, Jrv, Acta, Perfil y Rol
src/app/core/data: repositorios, única capa que importa Supabase
src/app/core/services: lógica de negocio y estado
src/app/core/validators: cédula y totales del acta
src/app/core/guards: sesión, rol y cambio de contraseña
src/app/shared/components: componentes reutilizables
src/app/pages: auth, provincial, recinto y veedor

Consecuencias
Beneficios:
•	Los tres integrantes usan la misma estructura.
•	En la defensa, cada capa se señala en una carpeta.
•	Cambiar de backend o agregar offline solo afecta a los repositorios.
Limitaciones:
•	Ninguna página ni componente importa Supabase.
•	Hay más código de paso entre capas.
Riesgo identificado:
•	Un servicio que llame directo a Supabase mezcla las capas. Se revisa en cada commit que Supabase solo se importe en los repositorios.
Verificación
1.	@supabase/supabase-js solo aparece dentro de src/app/core/data.
2.	Las páginas solo usan servicios, nunca repositorios.
3.	Un veedor que entra a una ruta de coordinador es redirigido por el guard.
4.	El proyecto compila y se sincroniza con Android sin errores.
Comandos de referencia:
ionic generate page pages/veedor/mis-mesas
ionic generate service core/services/actas
ionic generate guard core/guards/rol
grep -r "@supabase/supabase-js" src/app
ionic build
npx cap sync android

Uso de IA
Herramienta: Claude
Consulta realizada: Comparación entre capas técnicas, organización por funcionalidad y servicios con acceso directo al backend, y propuesta de estructura de carpetas.
Consenso del equipo
Acuerdo final: Arquitectura por capas (páginas, componentes, servicios, modelos, guards y repositorios), común para los tres integrantes.
Minuto del video: 00:02:34 a 00:05:34
 
ADR-003: Plugins oficiales de Capacitor para cámara y geolocalización
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R7: foto del acta, control de nitidez y coordenadas GPS.
•	R6: registro de actas desde la aplicación móvil.
Contexto
El veedor debe fotografiar el acta y registrar su ubicación desde Android. La app tiene que manejar permisos denegados, cámara no disponible y GPS sin señal.
Alternativas consideradas
Alternativa 1: Plugins oficiales @capacitor/camera y @capacitor/geolocation
Ventajas:
•	Están hechos para Capacitor.
•	Dan acceso nativo a la cámara y al GPS.
•	Gestionan los permisos del dispositivo.
Desventajas:
•	Requieren instalación y permisos en Android.
•	Hay que controlar errores que varían entre dispositivos.
Alternativa 2: APIs del navegador (navigator.geolocation y captura HTML)
Ventajas:
•	No necesitan plugins extra.
•	Bastan para apps web sencillas.
Desventajas:
•	Su comportamiento cambia según el navegador.
•	La integración con Android es menos directa.
Decisión
Se usan @capacitor/camera y @capacitor/geolocation. La app pide permisos al usarlos, revisa la calidad de la foto antes de aceptarla, guarda latitud y longitud con el acta y muestra un mensaje si algo falla.
Consecuencias
Beneficios:
•	Acceso nativo a cámara y GPS desde los servicios.
•	Errores y permisos controlados en la app.
Limitaciones:
•	Depende de los permisos que conceda el usuario.
•	El GPS puede fallar o ser impreciso.
•	Las fotos pueden salir borrosas o con poca luz.
Riesgo identificado:
•	El comportamiento real solo se confirma probando en dispositivos Android.
Verificación
1.	Tomar una foto desde la app y verla antes de aceptarla.
2.	Obtener la ubicación y registrar latitud y longitud.
3.	Denegar los permisos y comprobar que aparecen los mensajes.
4.	Probar el caso sin ubicación disponible.
5.	Comprobar que foto y coordenadas quedan asociadas al acta.
Uso de IA
Herramienta: ChatGPT
Consulta realizada: Comparación de alternativas para cámara y GPS, identificación de los plugins necesarios y organización de las pruebas.
Consenso del equipo
Acuerdo final: Plugins oficiales @capacitor/camera y @capacitor/geolocation.
Minuto del video: 00:18:22
 
ADR-004: Supabase como backend (Auth, PostgreSQL con RLS, Storage y Edge Functions)
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R2: cuentas creadas por jerarquía, sin autorregistro.
•	R3: claves de administrador fuera de la app.
•	R4: avance de actas y dashboard de votos.
•	R8: reglas de acceso por rol y pertenencia; un veedor no accede a mesas ajenas.
•	R10: sincronización de registros pendientes.
Contexto
La app necesita autenticación, almacenamiento de fotos y control de acceso para tres roles. Los datos son relacionales, no hay autorregistro y las claves de administrador no pueden ir en la app.
Alternativas consideradas
Alternativa 1: Supabase
Ventajas:
•	Base relacional para recintos, JRV, veedores y actas.
•	Auth, Storage y RLS en un solo servicio.
•	Las RLS se prueban con consultas SQL.
•	Edge Functions gratuitas para crear cuentas.
•	Vistas SQL para el dashboard.
Desventajas:
•	No tiene offline nativo.
•	Las RLS deben escribirse con cuidado.
Alternativa 2: Firebase
Ventajas:
•	Firestore trae persistencia offline.
•	Security Rules por documento y colección.
•	El equipo ya lo ha usado.
Desventajas:
•	Crear cuentas sin autorregistro exige Cloud Functions y el plan Blaze, que es de pago.
•	La caché offline no sube fotos a Storage.
•	No agrupa resultados para el dashboard.
Alternativa 3: Appwrite
Ventajas:
•	Roles con Labels y Teams desde la consola.
•	Se puede instalar en un servidor propio.
Desventajas:
•	Poca documentación con Ionic.
•	Reasignar un veedor obliga a actualizar permisos registro por registro.
Decisión
Se elige Supabase. Encaja con el modelo relacional, sus reglas se prueban con SQL y permite crear cuentas con Edge Functions en el plan gratuito, mientras que Firebase pedía el plan Blaze. Appwrite se descarta por su poca documentación con Ionic. El modo offline se resuelve en el ADR-006.
Consecuencias
Beneficios:
•	Todo en un solo servicio gratuito.
•	R8 se demuestra con consultas SQL.
•	Las claves de administrador quedan fuera de la app.
Limitaciones:
•	El modo offline se implementa aparte.
•	Las Edge Functions se despliegan con la CLI de Supabase.
•	El plan gratuito se pausa por inactividad.
Riesgo identificado:
•	Una política RLS mal escrita puede exponer datos de otra mesa. Cada política se prueba con sesiones de distintos roles.
Verificación
1.	El veedor A consulta la JRV del veedor B y obtiene cero filas.
2.	El veedor A no puede descargar fotos de otra mesa.
3.	supabase.auth.signUp() desde la app falla.
4.	Un veedor que invoca la Edge Function de cuentas recibe un error de autorización.
5.	Los totales del dashboard coinciden con una suma manual.
Comandos de referencia:
npm install @supabase/supabase-js
npx supabase init
npx supabase functions deploy crear-usuario
ionic build
npx cap sync android

Uso de IA
Herramienta: Claude
Consulta realizada: Comparación de Firebase, Supabase y Appwrite para crear cuentas sin autorregistro, control de acceso por rol, dashboard y soporte offline.
Consenso del equipo
Acuerdo final: Supabase como backend común. Se descarta Firebase por el plan Blaze y Appwrite por su poca documentación con Ionic.
Minuto del video: 00:10:11 a 00:14:41
 
ADR-005: Estado híbrido (Signals y RxJS), formularios reactivos, validaciones y manejo global de errores
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R2: validación del dígito verificador de la cédula.
•	R3: cambio obligatorio de la contraseña inicial.
•	R6: los votos, blancos y nulos deben sumar el total de sufragantes.
•	R9: estados explícitos de carga, éxito, error y validación.
Contexto
Se necesita una forma común de manejar el estado, mostrar carga, éxito, error y validación, validar los formularios críticos y reaccionar a los cambios de red sin poner lógica en los componentes.
Alternativas consideradas
Alternativa 1: Modelo híbrido: Signals, BehaviorSubject con toSignal, Reactive Forms y ToastController/AlertController
Ventajas:
•	Signals de solo lectura, sin desuscripciones manuales.
•	RxJS solo para la red y la resincronización.
•	Validadores propios para cédula y votos.
•	Errores centralizados.
•	Pruebas con ng test.
Desventajas:
•	Usar dos modelos reactivos exige disciplina.
•	No hay pruebas automatizadas de interfaz.
Alternativa 2: RxJS puro y formularios Template-Driven
Ventajas:
•	Un solo paradigma en toda la app.
•	Formularios simples rápidos de escribir.
Desventajas:
•	Más código para suscripciones.
•	Las validaciones cruzadas son difíciles.
Alternativa 3: Signals puro, sin RxJS
Ventajas:
•	Sintaxis uniforme para todo el estado.
Desventajas:
•	Poco práctico para eventos de red y colas de sincronización.
Decisión
Se adopta el modelo híbrido. Los servicios exponen Signals de solo lectura para el estado de las vistas, y BehaviorSubject con toSignal() se reserva para la red y la resincronización. Los formularios usan Reactive Forms con validadores propios, los errores se muestran con ToastController y AlertController, y ng test cubre las validaciones críticas.
Consecuencias
Beneficios:
•	No quedan suscripciones abiertas.
•	Las validaciones son reutilizables y tienen pruebas.
•	Los estados de carga, éxito y error se ven en toda la app.
Limitaciones:
•	Signals para datos e interfaz; RxJS solo para red.
•	La interfaz se prueba de forma manual en Android.
Riesgo identificado:
•	Mezclar Signals y RxJS puede confundir si no se define qué capa usa cada uno.
Verificación
1.	ng test pasa las pruebas de cédula, suma de votos y reglas de acceso.
2.	Una cédula inválida bloquea el formulario y muestra el mensaje.
3.	Un acta descuadrada muestra la alerta de validación.
4.	Un fallo de red muestra un aviso controlado.
Comandos de referencia:
ng test
ionic serve
ionic build

Uso de IA
Herramienta: Gemini
Consulta realizada: Comparación entre Signals, BehaviorSubject y Reactive Forms para estados de interfaz, conectividad y validaciones en Ionic Angular Standalone.
Consenso del equipo
Acuerdo final: Modelo híbrido con Signals, BehaviorSubject y toSignal, Reactive Forms, ToastController/AlertController y ng test.
Minuto del video: 00:05:34 a 00:10:11
 
ADR-006: Cola offline con @capacitor-community/sqlite y resolución de conflictos
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R5: el coordinador de recinto corrige datos y fotos de actas.
•	R6: el veedor registra y corrige actas.
•	R7: la foto y el GPS se guardan con el acta.
•	R10: persistencia local, sincronización automática y estrategia de conflictos.
Contexto
En recintos con mala señal, el veedor debe seguir registrando actas con foto y GPS. Al volver la conexión, la app sincroniza los pendientes sin pisar las correcciones del coordinador.
Alternativas consideradas
Alternativa 1: @capacitor-community/sqlite con cola de pendientes
Ventajas:
•	Guarda datos y fotos en el dispositivo sin límite de cuota.
•	Maneja estados de sincronización y transacciones.
•	Su estructura es compatible con PostgreSQL.
Desventajas:
•	Es un plugin mantenido por la comunidad.
•	Requiere configuración nativa y SQL local.
Alternativa 2: @capacitor/preferences
Ventajas:
•	Es oficial y simple para pares clave-valor.
Desventajas:
•	No sirve para fotos ni para colas de registros.
Decisión
Se usa @capacitor-community/sqlite para una cola local de actas con foto y GPS, que se sincroniza con Supabase cuando el monitor de red detecta conexión. Si un coordinador ya corrigió el acta, la versión del veedor no la sobrescribe y queda marcada para revisión.
Consecuencias
Beneficios:
•	El registro de actas sigue sin internet.
•	No se pierden fotos ni coordenadas.
•	Se respetan las correcciones del coordinador.
Limitaciones:
•	Cada registro lleva id único, estado y marca de tiempo.
•	SQLite se prueba en Android o emulador.
Riesgo identificado:
•	Al ser un plugin de la comunidad, puede tener problemas con versiones recientes de Android Gradle.
Verificación
1.	Instalar el plugin y sincronizar con Android sin errores de Gradle.
2.	En modo avión, registrar un acta con foto y GPS y verla como pendiente.
3.	Al quitar el modo avión, la foto y el acta se suben solas a Supabase.
4.	Una corrección previa del coordinador no se sobrescribe al sincronizar.
Comandos de referencia:
npm install @capacitor-community/sqlite
ionic build
npx cap sync android
npx cap open android

Uso de IA
Herramienta: Gemini
Consulta realizada: Comparación entre @capacitor/preferences y SQLite para fotos en cola offline, y estrategia de conflictos entre roles.
Consenso del equipo
Acuerdo final: SQLite para la cola local de actas con fotos y resolución de conflictos por marca de tiempo y jerarquía de rol.
Minuto del video: 00:20:27 a 00:23:02
 
Video de la reunión virtual
Grabación completa de la reunión de deliberación con los tres integrantes:
https://youtu.be/WVZ57HevW14
