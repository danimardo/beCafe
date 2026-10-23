// Genera un par de claves VAPID y lo imprime en la salida estándar (plan F6 T003). No escribe archivos:
// copia las claves a la configuración de Coolify o a tu `.env` local. Nunca las subas al repositorio.
import webpush from 'web-push';

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
process.stdout.write(`PUBLIC_VAPID_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\n`);
