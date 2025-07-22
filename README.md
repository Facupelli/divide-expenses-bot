# 🤖 Bot de Gestión de Gastos Grupales

Este bot te ayuda a manejar gastos compartidos entre un grupo de personas. Recibe mensajes en lenguaje natural (vía Telegram u otra interfaz) y registra quién pagó, cuánto, por qué y entre quiénes se reparte.

Ideal para juntadas, viajes o cualquier situación donde haya que dividir gastos.

---

# Repo en progreso

---

## 🚀 ¿Qué hace?

- Forma un grupo de personas entre los que se repartirán los gastos.
- Interpreta mensajes como:
  > "Martín gastó 5000 en birras"
- Confirma cada gasto con detalle.
- Divide el monto automáticamente (entre todos, o según se indique).
- Lleva un historial de lo que se pagó y quién puso cuánto.

---

## ⚙️ Tecnologías

- **Backend:** [Express](https://expressjs.com/) + [TypeScript](https://www.typescriptlang.org/)
- **Base de datos:** [SQLite](https://www.sqlite.org/)
- **IA (actual):** [OpenAI GPT](https://openai.com/)
- **UI (actual):** [Telegram Bot API](https://core.telegram.org/bots/api)

La idea es que puedas cambiar fácilmente tanto la capa de IA como la interfaz de mensajería.

---

## Imágenes

![Demo 1](./images/demo-1.jpeg)
![Demo 1.1](./images/demo-1.1.jpeg)
