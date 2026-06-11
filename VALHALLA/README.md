# Valhalla v2 — Centro de operaciones

## Stack
- React + Vite (frontend)
- Supabase (auth + base de datos)
- Vercel (despliegue + serverless proxy)
- Anthropic API (Claude Sonnet)

---

## Despliegue: paso a paso

### 1. Supabase — configurar base de datos

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar todo el contenido de `supabase_schema.sql`
3. Ir a **Authentication > Users** → crear los 4 usuarios (Invite user):
   - maria@valhalla.com
   - andres@valhalla.com
   - luisma@valhalla.com
   - jorge@valhalla.com
4. Una vez creados, copiar sus UUIDs y ejecutar en SQL Editor:

```sql
insert into public.profiles (id, name, role) values
  ('UUID-MARIA',  'María',  'admin'),
  ('UUID-ANDRES', 'Andrés', 'comercial'),
  ('UUID-LUISMA', 'Luisma', 'digital'),
  ('UUID-JORGE',  'Jorge',  'transversal');

insert into public.user_memory (user_id) values
  ('UUID-MARIA'), ('UUID-ANDRES'), ('UUID-LUISMA'), ('UUID-JORGE');
```

5. Copiar las credenciales del proyecto:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

### 2. GitHub — subir el repositorio

```bash
git init
git add .
git commit -m "Valhalla v2"
git remote add origin https://github.com/TU_USUARIO/valhalla-v2.git
git push -u origin main
```

### 3. Vercel — desplegar

1. [vercel.com](https://vercel.com) → New Project → importar repo
2. En **Environment Variables** añadir:

```
ANTHROPIC_API_KEY      = sk-ant-...
VITE_SUPABASE_URL      = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...
```

3. Deploy → listo.

---

## Estructura del proyecto

```
valhalla-v2/
├── api/
│   └── claude.js              # Proxy seguro a Anthropic (la API key nunca llega al frontend)
├── src/
│   ├── lib/
│   │   ├── supabase.js        # Cliente Supabase
│   │   ├── auth.jsx           # Context de autenticación
│   │   ├── db.js              # Todos los helpers de base de datos
│   │   └── prompts.js         # ADN Valhalla + system prompts
│   ├── components/
│   │   ├── Login.jsx          # Pantalla de acceso
│   │   ├── Chat.jsx           # Componente de chat (memoria, persistencia, detección de acciones)
│   │   ├── Captacion.jsx      # Módulo comercial
│   │   ├── Digital.jsx        # Módulo digital
│   │   └── Dashboard.jsx      # Pipeline + calendario + métricas de equipo
│   ├── App.jsx                # Shell principal con nav
│   └── main.jsx
├── supabase_schema.sql        # Esquema completo de la BD
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## Roles de usuario

| Usuario | Rol          | Acceso |
|---------|--------------|--------|
| María   | admin        | Todo + vista de equipo en dashboard |
| Andrés  | comercial    | Captación + Dashboard |
| Luisma  | digital      | Digital + Dashboard |
| Jorge   | transversal  | Todo + puede ver conversaciones de otros |

---

## Qué mide la BD

- Sesiones y mensajes por usuario
- Evolución del pitch (módulo captación)
- Ratio PASA/PASA CON AJUSTES/NO PASA (módulo filtro)
- Estado del pipeline de prospectos
- Acciones pendientes por persona
- Última actividad por usuario

---

## ADN Valhalla

Todo el contexto de marca está en `src/lib/prompts.js` → `VALHALLA_CORE`.
Cualquier cambio de posicionamiento, precio o foco de mercado se actualiza ahí y se propaga a todos los módulos.
