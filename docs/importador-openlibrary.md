# Importador de Catalogo con Open Library

Este importador evita depender de la web de la universidad y llena metadatos bibliograficos desde Open Library.

## Variables necesarias

En .env.local debes tener:

- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## Ejecucion

Importar una consulta por texto:

```bash
npm run import:catalog -- "historia venezuela" 30
```

- Primer argumento: texto de busqueda.
- Segundo argumento: limite de resultados (opcional, por defecto 25).

## Que llena en la base de datos

- categories
- authors
- books
- book_authors

## Recomendaciones

1. Ejecutar por lotes tematicos: derecho, agronomia, educacion, etc.
2. Luego validar duplicados por ISBN y titulo.
3. Cargar ejemplares fisicos por separado en physical_copies.
4. Cargar archivos digitales por separado en ebooks.

## Importante

El importador crea metadatos, no sube PDFs ni crea prestamos.
