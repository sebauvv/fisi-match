# db/ - Modulo de Base de Datos

PostgreSQL + pgvector para almacenar los vectores semanticos generados en Fase 2.

## Modos de operacion

| Modo | Infraestructura | Costo | Uso |
|---|---|---|---|
| Local | Docker (`pgvector/pgvector:pg16`) | $0 | Desarrollo y pruebas |
| Cloud | RDS `db.t3.micro` (Terraform) | ~$0.017/hr | Produccion y Lambda |

## Uso local (Docker)

```bash
docker compose up -d

# dependencias del seed
cd seed
pip install -r requirements.txt
cp .env.example .env

# Primer seed a la DB (advisors de fase 1 y embeddings de fase 2)
python seed.py

# (opcional) Por si se necesita volver a hacer seed desde 0
python seed.py --clear

# Si se quiere volver a aplicar el schema
docker compose exec -T postgres psql -U advisor_user -d advisors_db < schema.sql

# Segundo seed a la DB (jsons faltantes de la fase 1 para consumo de la API)
python seed_catalog.py --dry-run # para verificar conteos antes de seed

python seed_catalog.py

# (lo mismo si se quiere desde 0)
python seed_catalog.py --clear

```

La DB queda accesible en `localhost:5433` con usuario `advisor_user`.

## Uso cloud (RDS)

```bash
# crea RDS
cd terraform
terraform init
terraform apply -var="db_password=TU_PASSWORD"

# aplica schema manualmente
psql -h ENDPOINT -U advisor_user -d advisors_db -f ../schema.sql

# para poblar
cd ../seed
# para editar .env con DB_MODE=cloud y credenciales RDS
python seed.py
```

## Schema

Dos tablas definidas en `schema.sql`:

- **advisors**: metadata relacional (id, nombre, ORCID, areas)
- **knowledge_vectors**: vectores 1024d con indice HNSW para kNN coseno
- **research_areas**: areas unicas de cada asesor en lo que trabajaron
- **thesis_subjects**: materias unicas de cada tesis
- **publication_types**: tipos de publicacion
- **theses**: tesis de Cybertesis
- **external_publications**: publicaciones de ORCID/Scopus


El indice HNSW (`m=16, ef_construction=64`) acelera la busqueda de similitud sobre los 2311 vectores.
