# Carga Inicial del Catalogo Sin API Oficial

## Problema actual

La web de la universidad no ofrece una API utilizable y solo publica metadatos basicos (titulo y autor). Para construir el catalogo completo, debemos usar una estrategia hibrida.

## Estrategia recomendada

1. Fase 1: Carga semilla de metadatos

- Extraer titulo y autor desde la pagina publica.
- Completar manualmente campos minimos: categoria, tipo de material, referencia/no referencia.
- Importar primero registros bibliograficos, no ejemplares.

2. Fase 2: Levantamiento de inventario fisico

- Bibliotecario registra cada ejemplar fisico con codigo de inventario.
- Estados iniciales permitidos: disponible, reparacion, prestado.
- Esto habilita prestamos reales con control por copia.

3. Fase 3: Coleccion electronica

- Solo subir archivos con licencia valida o de dominio publico.
- Guardar archivos en Supabase Storage (bucket ebooks).
- Definir acceso por nivel:
  - publico: invitados y autenticados.
  - comunidad: solo autenticados UNELLEZ.
  - restringido: solo personal autorizado.

4. Fase 4: Calidad y deduplicacion

- Regla de deduplicacion por ISBN cuando exista.
- Si no hay ISBN, usar clave normalizada: titulo + autor principal + anio.
- Revisiones por lotes antes de publicar en catalogo publico.

## Flujo de tablas (ya contemplado en migracion)

- books: registro bibliografico maestro.
- authors y book_authors: autores multiples.
- physical_copies: cada copia prestable con su estado.
- ebooks: recurso digital para lectura.
- loans y reservations: operacion de prestamo fisico.
- ebook_reads: trazabilidad de lectura digital.

## Recomendaciones para poblar rapido

1. Crear una plantilla CSV con columnas minimas:

- titulo, autor, categoria, tipo_material, referencia, isbn, anio, editorial

2. Cargar primero books/authors.

3. Cargar despues physical_copies:

- book_id, inventory_code, status, location

4. Cargar ebooks al final:

- book_id, storage_path, access_level, format

## Criterio de negocio para tu caso

- Prestamo aplica a physical_copies.
- Lectura en linea aplica a ebooks.
- Invitado y estudiante podran leer ebook si access_level lo permite.

## Nota legal importante

No publicar PDF con copyright sin permiso. Para material protegido, usar solo metadatos y disponibilidad fisica.
