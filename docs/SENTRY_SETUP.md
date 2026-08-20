# Sentry Error Tracking Setup

Error tracking en producción para visibilidad de issues en tiempo real.

## Backend Setup

### 1. Install Sentry SDK
```bash
cd backend
npm install @sentry/node
```

### 2. Add to `server.js` (top of file)
```javascript
import * as Sentry from "@sentry/node";

// Initialize before other middleware
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

app.use(Sentry.Handlers.requestHandler());
```

### 3. Add error handler (before app.listen)
```javascript
app.use(Sentry.Handlers.errorHandler());

app.use((err, req, res, next) => {
  Sentry.captureException(err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    requestId: req.requestId,
  });
});
```

## Frontend Setup

### 1. Install Sentry SDK
```bash
cd frontend
npm install @sentry/react
```

### 2. Add to `main.jsx`
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 3. Wrap App Component
```javascript
const SentryRoutes = Sentry.withSentryRouting(Routes);

// Use SentryRoutes instead of Routes
```

## Environment Variables

### Render Backend (.env)
```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Vercel Frontend
```
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Get Your DSN

1. Go to https://sentry.io (create account if needed)
2. Create new project → Node.js (backend) and React (frontend)
3. Copy DSN from Settings → Client Keys
4. Add to Render/Vercel environment variables

## Verification

Backend will automatically capture:
- ❌ Unhandled exceptions
- ❌ 5xx errors
- ⚠️ Request duration outliers
- 📊 Performance metrics

Frontend will automatically capture:
- ❌ JS errors
- ❌ Console errors
- 🔄 Network errors
- 📱 User session replays (on error)

## Data Privacy

By default Sentry redacts:
- Passwords & auth tokens
- Email addresses
- Credit card numbers
- API keys

For additional redaction, use Sentry's `beforeSend`:
```javascript
Sentry.init({
  beforeSend(event) {
    // Custom filtering
    return event;
  },
});
```

---

**Cost:** Free tier covers most startups (~10k errors/month)
