#!/usr/bin/env python3
"""
NEXO Store — Backend Flask + Bot Telegram
Pembeli order di website → Flask terima → notif admin Telegram → admin konfirm → kirim produk ke Gmail
"""

import os, json, time, smtplib, logging, threading, urllib.request
from flask import Flask, request, jsonify
from flask_cors import CORS
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

# =====================
# KONFIGURASI
# =====================
BOT_TOKEN  = os.environ.get("BOT_TOKEN", "GANTI_TOKEN_BOT_BARU")
ADMIN_ID   = int(os.environ.get("ADMIN_ID", "7619879885"))
GMAIL_USER = os.environ.get("GMAIL_USER", "raffiramadhan8488@gmail.com")
GMAIL_PASS = os.environ.get("GMAIL_PASS", "osdfyqnbvlhwepnm").replace(" ", "")
DANA_NUMBER = os.environ.get("DANA_NUMBER", "088218403135")
QR_IMAGE_URL = os.environ.get("QR_IMAGE_URL", "")  # Isi link gambar QR QRIS kamu

PORT = int(os.environ.get("PORT", 5000))

logging.basicConfig(format="%(asctime)s — %(levelname)s — %(message)s", level=logging.INFO)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Izinkan website akses API ini

bot = telebot.TeleBot(BOT_TOKEN)

# =====================
# PENYIMPANAN ORDER
# =====================
orders = {}
order_counter = 1

def next_order_id():
    global order_counter
    oid = f"ORD{order_counter:04d}"
    order_counter += 1
    return oid

def fmt_rupiah(n):
    return f"Rp {int(n):,}".replace(",", ".")

# =====================
# PRODUK — dari Firebase Realtime Database
# =====================
FIREBASE_URL = os.environ.get("FIREBASE_URL", "https://rapi-chat-default-rtdb.asia-southeast1.firebasedatabase.app")

def get_product(prod_id):
    """Ambil satu produk dari Firebase"""
    try:
        url = f"{FIREBASE_URL}/products/{prod_id}.json"
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read().decode())
        return data
    except Exception as e:
        log.error(f"Gagal ambil produk {prod_id}: {e}")
        return None

# =====================
# API ENDPOINTS
# =====================

@app.route("/api/order", methods=["POST"])
def create_order():
    """Pembeli submit order dari website"""
    data = request.json
    prod_id = data.get("prodId")
    email   = data.get("email", "").strip().lower()
    method  = data.get("method")  # 'dana' atau 'qr'

    if not prod_id or not email or not method:
        return jsonify({"ok": False, "msg": "Data tidak lengkap"}), 400

    product = get_product(prod_id)
    if not product:
        return jsonify({"ok": False, "msg": "Produk tidak ditemukan"}), 404

    order_id = next_order_id()
    orders[order_id] = {
        "prod_id": prod_id,
        "product": product,
        "price": product["price"],
        "email": email,
        "method": method,
        "status": "pending",  # pending → waiting_confirm → done / cancelled
        "created_at": time.time(),
    }

    method_label = "QR Code (QRIS)" if method == "qr" else "DANA"

    # Notif ke admin Telegram
    kb = InlineKeyboardMarkup()
    kb.add(
        InlineKeyboardButton("✅ Konfirmasi & Kirim Instruksi", callback_data=f"confirm:{order_id}"),
        InlineKeyboardButton("❌ Tolak", callback_data=f"reject:{order_id}")
    )
    try:
        bot.send_message(
            ADMIN_ID,
            f"🛒 *PESANAN BARU!*\n\n"
            f"📌 Order: `{order_id}`\n"
            f"📦 Produk: {product['emoji']} {product['name']}\n"
            f"💰 Harga: *{fmt_rupiah(product['price'])}*\n"
            f"💳 Metode: *{method_label}*\n"
            f"📧 Gmail: `{email}`\n\n"
            f"Klik konfirmasi untuk lanjutkan:",
            parse_mode="Markdown",
            reply_markup=kb
        )
    except Exception as e:
        log.error(f"Gagal notif admin: {e}")

    # Kembalikan info pembayaran ke website
    payment_info = {}
    if method == "qr":
        payment_info = {
            "type": "qr",
            "qr_url": QR_IMAGE_URL,
            "amount": product["price"],
        }
    else:
        payment_info = {
            "type": "dana",
            "number": DANA_NUMBER,
            "amount": product["price"],
        }

    return jsonify({
        "ok": True,
        "order_id": order_id,
        "payment": payment_info,
        "product_name": product["name"],
    })


@app.route("/api/order/<order_id>/paid", methods=["POST"])
def buyer_paid(order_id):
    """Pembeli klik 'Sudah Bayar' di website"""
    order = orders.get(order_id)
    if not order:
        return jsonify({"ok": False, "msg": "Order tidak ditemukan"}), 404

    order["status"] = "waiting_confirm"

    # Notif admin untuk verifikasi
    kb = InlineKeyboardMarkup()
    kb.add(
        InlineKeyboardButton("✅ Bayar Masuk — Kirim Produk", callback_data=f"paid:{order_id}"),
        InlineKeyboardButton("❌ Belum Masuk", callback_data=f"notpaid:{order_id}")
    )
    try:
        bot.send_message(
            ADMIN_ID,
            f"🔍 *VERIFIKASI PEMBAYARAN*\n\n"
            f"📌 Order: `{order_id}`\n"
            f"📦 {order['product']['name']}\n"
            f"💰 {fmt_rupiah(order['price'])}\n"
            f"📧 {order['email']}\n\n"
            f"⚠️ Pembeli klaim sudah transfer. Cek mutasi kamu!",
            parse_mode="Markdown",
            reply_markup=kb
        )
    except Exception as e:
        log.error(f"Gagal notif admin: {e}")

    return jsonify({"ok": True, "msg": "Menunggu konfirmasi admin"})


@app.route("/api/order/<order_id>/status", methods=["GET"])
def order_status(order_id):
    """Website polling status order"""
    order = orders.get(order_id)
    if not order:
        return jsonify({"ok": False, "msg": "Order tidak ditemukan"}), 404
    return jsonify({"ok": True, "status": order["status"]})


# =====================
# TELEGRAM CALLBACK
# =====================

@bot.callback_query_handler(func=lambda c: True)
def handle_callback(call):
    data = call.data
    cid  = call.message.chat.id

    if cid != ADMIN_ID:
        bot.answer_callback_query(call.id, "Bukan admin.")
        return

    # Admin konfirmasi pesanan (kirim instruksi ke website via status)
    if data.startswith("confirm:"):
        order_id = data.split(":", 1)[1]
        order = orders.get(order_id)
        if not order:
            bot.answer_callback_query(call.id, "Order tidak ditemukan.")
            return
        order["status"] = "payment_sent"
        bot.edit_message_text(
            chat_id=cid,
            message_id=call.message.message_id,
            text=f"✅ Order `{order_id}` dikonfirmasi.\nInstruksi pembayaran sudah tampil di website pembeli.",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "Instruksi dikirim ke website!")

    # Admin tolak
    elif data.startswith("reject:"):
        order_id = data.split(":", 1)[1]
        order = orders.get(order_id)
        if not order:
            bot.answer_callback_query(call.id, "Order tidak ditemukan.")
            return
        order["status"] = "cancelled"
        bot.edit_message_text(
            chat_id=cid,
            message_id=call.message.message_id,
            text=f"❌ Order `{order_id}` ditolak.",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "Order ditolak.")

    # Admin konfirmasi bayar masuk → kirim produk ke Gmail
    elif data.startswith("paid:"):
        order_id = data.split(":", 1)[1]
        order = orders.get(order_id)
        if not order:
            bot.answer_callback_query(call.id, "Order tidak ditemukan.")
            return

        order["status"] = "done"
        email_ok = kirim_email(order["email"], order_id, order["product"], order["price"])

        status_txt = f"✅ Email terkirim ke {order['email']}" if email_ok else "⚠️ Gagal kirim email — kirim manual!"
        bot.edit_message_text(
            chat_id=cid,
            message_id=call.message.message_id,
            text=f"✅ *Order `{order_id}` SELESAI!*\n\n{status_txt}",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "Produk dikirim ke Gmail pembeli!")

    # Admin: bayar belum masuk
    elif data.startswith("notpaid:"):
        order_id = data.split(":", 1)[1]
        order = orders.get(order_id)
        if not order:
            bot.answer_callback_query(call.id, "Order tidak ditemukan.")
            return
        order["status"] = "payment_sent"  # Kembalikan ke state sebelumnya
        bot.edit_message_text(
            chat_id=cid,
            message_id=call.message.message_id,
            text=f"⚠️ Order `{order_id}` — pembayaran belum masuk.\nPembeli dinotifikasi di website.",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "Pembeli dinotifikasi.")


# =====================
# KIRIM EMAIL
# =====================
def kirim_email(to_email, order_id, product, price):
    try:
        content = product["content"].replace("{oid}", order_id)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"✅ Pesanan #{order_id} — {product['name']} | NEXO Store"
        msg["From"]    = f"NEXO Store <{GMAIL_USER}>"
        msg["To"]      = to_email

        plain = f"Halo!\n\nPembayaran order #{order_id} dikonfirmasi.\n\n{content}\n\nSalam,\nNEXO Store"
        html = f"""
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0f1e;font-family:Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#0e1525;border-radius:18px;overflow:hidden;border:1px solid rgba(123,95,255,0.3)">
  <div style="background:linear-gradient(135deg,#7B5FFF,#00D9FF);padding:28px;text-align:center">
    <div style="font-size:2rem;font-weight:900;color:#fff">NEXO</div>
    <div style="color:rgba(255,255,255,0.85);font-size:0.85rem">Store & Digital Services</div>
  </div>
  <div style="padding:28px">
    <div style="background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.3);border-radius:12px;padding:16px;margin-bottom:20px;text-align:center">
      <div style="font-size:2rem">✅</div>
      <div style="color:#00e676;font-weight:700;font-size:1.1rem;margin-top:6px">Pembayaran Berhasil!</div>
    </div>
    <div style="background:rgba(123,95,255,0.08);border:1px solid rgba(123,95,255,0.2);border-radius:14px;padding:20px;margin-bottom:16px">
      <div style="font-size:2rem;margin-bottom:8px">{product['emoji']}</div>
      <div style="color:#e2e8f8;font-weight:700;font-size:1rem;margin-bottom:8px">{product['name']}</div>
      <div style="color:#64748b;font-size:0.82rem;line-height:1.7;white-space:pre-line">{content}</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr style="border-bottom:1px solid rgba(123,95,255,0.1)">
        <td style="padding:10px 0;color:#64748b;font-size:0.82rem">Order ID</td>
        <td style="padding:10px 0;color:#e2e8f8;font-size:0.82rem;text-align:right;font-weight:600">{order_id}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:0.82rem">Total</td>
        <td style="padding:10px 0;color:#00D9FF;font-size:1rem;text-align:right;font-weight:700">{fmt_rupiah(price)}</td>
      </tr>
    </table>
    <p style="color:#475569;font-size:0.75rem;text-align:center;margin-top:20px">Pertanyaan? Email: <a href="mailto:support@nexo.store" style="color:#7B5FFF">support@nexo.store</a></p>
  </div>
  <div style="background:rgba(0,0,0,0.2);padding:14px;text-align:center">
    <div style="color:#334155;font-size:0.72rem">© 2025 NEXO Store</div>
  </div>
</div></body></html>"""

        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
            smtp.login(GMAIL_USER, GMAIL_PASS)
            smtp.sendmail(GMAIL_USER, to_email, msg.as_string())

        log.info(f"Email terkirim ke {to_email} untuk order {order_id}")
        return True
    except Exception as e:
        log.error(f"Gagal kirim email: {e}")
        return False


# =====================
# JALANKAN BOT + FLASK BERSAMAAN
# =====================
def run_bot():
    log.info("🤖 Bot Telegram berjalan...")
    bot.infinity_polling(timeout=30, long_polling_timeout=30)

if __name__ == "__main__":
    log.info(f"🚀 NEXO Server berjalan di port {PORT}")
    log.info(f"   Admin ID : {ADMIN_ID}")
    log.info(f"   Gmail    : {GMAIL_USER}")
    log.info(f"   DANA     : {DANA_NUMBER}")

    # Jalankan bot di thread terpisah
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()

    # Jalankan Flask
    app.run(host="0.0.0.0", port=PORT, debug=False)
