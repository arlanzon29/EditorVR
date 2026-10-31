# Trabajar con Claude por voz

Cómo está montado el trabajo con Claude Code hablando, sin teclado.

## Dictar: Acceso por voz de Windows 11

- Configuración → Accesibilidad → Voz → **Acceso por voz** (funciona en español).
- Se dicta directamente en la caja de mensajes de Claude.
- Para enviar: termina la frase, **haz una pausa de un segundo** y di
  **"pulsar Intro"**. Sin la pausa, Windows lo escribe como texto
  y aparece "Intro" al final del mensaje.
- "qué puedo decir" muestra la lista de órdenes.
- El dictado a veces cambia palabras ("Jordi" por "joystick", "paseo" por
  "pasillo"); Claude las interpreta por el contexto.

## Modo Quest y modo ordenador

La voz (el "Recibido" y Claude hablando) **solo se usa cuando se trabaja con las gafas puestas**.
Delante del ordenador no se habla: se lee la pantalla. Por defecto, sin voz: hay que pedirla en cada sesión.

- **Modo Quest:** existe el archivo `.claude/modo-quest` (vacío). Se dice "Recibido" al enviar
  y Claude habla.
- **Modo ordenador:** no existe ese archivo. Silencio.

Para cambiar, basta con decírselo a Claude ("estoy en el Quest" / "estoy en el ordenador"):
crea o borra el archivo. El archivo es personal y está en `.gitignore`.

## Aviso "Recibido" al enviar

En modo Quest, un hook de Claude Code dice "Recibido" en voz alta en cuanto se envía un
mensaje, antes de que Claude empiece a pensar. Si no se oye, el mensaje no se ha enviado.

- `.claude/settings.local.json`: hook `UserPromptSubmit`, asíncrono, que ejecuta
  `.claude/hooks/recibido.ps1`.
- `.claude/hooks/recibido.ps1`: si no existe `.claude/modo-quest` no hace nada; si existe,
  usa `System.Speech` con la voz **Microsoft Helena Desktop** (es-ES, viene con Windows).
- Los dos archivos son personales y están en `.gitignore`. Se cargan al abrir una
  sesión nueva de Claude Code.

## Claude hablando

Claude habla con la misma voz desde PowerShell:

```powershell
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Helena Desktop')
$s.Speak('Listo')
```

Lo que se le ha pedido en modo Quest (las instrucciones para Claude están en [CLAUDE.md](CLAUDE.md)):

- **Al recibir una orden:** una o dos frases cortas con lo que va a hacer.
- **Al terminar:** un resumen corto de lo que ha quedado hecho.
