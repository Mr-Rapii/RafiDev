#!/usr/bin/env python3
"""
NEXO Store — Bot Telegram Sistem Pembayaran Otomatis
Alur: Pembeli klik beli → pilih metode → admin dikonfirmasi → kirim QR/instruksi → admin konfirm bayar → kirim produk ke Gmail
"""

import os
import json
import smtplib
import logging
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from telebot import TeleBot, types
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

# =====================
# KONFIGURASI
# =====================
BOT_TOKEN   = os.environ.get("BOT_TOKEN", "8675537430:AAFNdmH3-J0QCJOnQXh6nmUOFLc5Lhe_PBw")
ADMIN_ID    = int(os.environ.get("ADMIN_ID", "7619879885"))
GMAIL_USER  = os.environ.get("GMAIL_USER", "raffiramadhan8488@gmail.com")   # Ganti email Gmail kamu
GMAIL_PASS  = os.environ.get("GMAIL_PASS", "osdfyqnbvlhwepnm")              # App password (spasi dihapus otomatis)

# Hapus spasi dari app password jika ada
GMAIL_PASS = GMAIL_PASS.replace(" ", "")

# =====================
# URL QR CODE PEMBAYARAN
# Ganti dengan link gambar QR QRIS/GoPay/dll kamu
# =====================
QR_IMAGE_URL = os.environ.get("QR_IMAGE_URL", "gambar/qr_ID1025413112901_10.06.26_1781089235_1781089235997.jpeg")

# =====================
# NOMOR DANA
# =====================
DANA_NUMBER = os.environ.get("DANA_NUMBER", "088218403135")   # Ganti nomor DANA kamu

logging.basicConfig(
    format="%(asctime)s — %(levelname)s — %(message)s",
    level=logging.INFO
)
log = logging.getLogger(__name__)

bot = TeleBot(BOT_TOKEN)

# =====================
# PENYIMPANAN ORDER (in-memory, bisa diganti database)
# Struktur: { order_id: { buyer_id, name, product, price, method, email, status } }
# =====================
orders: dict = {}
order_counter = 1

def next_order_id():
    global order_counter
    oid = f"ORD{order_counter:04d}"
    order_counter += 1
    return oid

# =====================
# DATA PRODUK
# Sesuaikan dengan produk toko NEXO kamu
# =====================
PRODUCTS = {
    "prod_1": {
        "name": "Wireless Headphone Pro X",
        "price": 459000,
        "emoji": "🎧",
        "description": "Headphone wireless premium dengan kualitas suara terbaik",
        "file_content": "Terima kasih telah membeli Wireless Headphone Pro X!\n\nNomor Serial: WH-PRO-{order_id}\nGaransi: 12 bulan\nManual: https://nexo.store/manual/headphone-pro-x\n\nHubungi support@nexo.store jika ada kendala."
    },
    "prod_2": {
        "name": "Mechanical Keyboard RGB TKL",
        "price": 385000,
        "emoji": "⌨️",
        "description": "Keyboard mekanikal dengan backlight RGB",
        "file_content": "Terima kasih telah membeli Mechanical Keyboard RGB TKL!\n\nNomor Serial: KB-RGB-{order_id}\nGaransi: 12 bulan\nDriver & Software: https://nexo.store/driver/keyboard-rgb\n\nHubungi support@nexo.store jika ada kendala."
    },
    "prod_3": {
        "name": "Gaming Mouse Wireless 25K DPI",
        "price": 289000,
        "emoji": "🖱️",
        "description": "Mouse gaming wireless presisi tinggi 25K DPI",
        "file_content": "Terima kasih telah membeli Gaming Mouse Wireless 25K DPI!\n\nNomor Serial: MS-25K-{order_id}\nGaransi: 12 bulan\nSoftware: https://nexo.store/software/gaming-mouse\n\nHubungi support@nexo.store jika ada kendala."
    },
    "prod_4": {
        "name": "Smart LED Lamp RGB",
        "price": 125000,
        "emoji": "💡",
        "description": "Lampu LED pintar 16 juta warna dengan kontrol app",
        "file_content": "Terima kasih telah membeli Smart LED Lamp RGB!\n\nKode Aktivasi App: LED-{order_id}\nApp: https://nexo.store/app/smart-led\n\nHubungi support@nexo.store jika ada kendala."
    },
    "prod_5": {
        "name": "Ring Light 18 inch Pro",
        "price": 215000,
        "emoji": "📷",
        "description": "Ring light profesional untuk streaming & konten kreator",
        "file_content": "Terima kasih telah membeli Ring Light 18 inch Pro!\n\nNomor Serial: RL-18-{order_id}\nGaransi: 6 bulan\nManual: https://nexo.store/manual/ring-light\n\nHubungi support@nexo.store jika ada kendala."
    },
    "prod_6": {
        "name": "MagSafe Charger Stand 3-in-1",
        "price": 199000,
        "emoji": "📱",
        "description": "Charger stand 3-in-1 kompatibel MagSafe",
        "file_content": "Terima kasih telah membeli MagSafe Charger Stand 3-in-1!\n\nNomor Serial: CS-3IN1-{order_id}\nGaransi: 12 bulan\n\nHubungi support@nexo.store jika ada kendala."
    },
    "svc_1": {
        "name": "Desain Logo",
        "price": 150000,
        "emoji": "🎨",
        "description": "Desain logo profesional, revisi tidak terbatas",
        "file_content": "Terima kasih telah memesan Desain Logo!\n\nOrder ID: {order_id}\nAdmin kami akan menghubungi kamu dalam 1x24 jam untuk memulai diskusi brief.\n\nEmail brief ke: design@nexo.store\nWhatsApp: wa.me/628xxxxxxxxxx"
    },
    "svc_2": {
        "name": "Pembuatan Website",
        "price": 500000,
        "emoji": "💻",
        "description": "Website modern, responsif, dan cepat",
        "file_content": "Terima kasih telah memesan Pembuatan Website!\n\nOrder ID: {order_id}\nAdmin kami akan menghubungi kamu dalam 1x24 jam.\n\nEmail: web@nexo.store"
    },
}

def fmt_rupiah(amount: int) -> str:
    return f"Rp {amount:,}".replace(",", ".")

# =====================
# HELPER KEYBOARD
# =====================
def product_keyboard() -> InlineKeyboardMarkup:
    kb = InlineKeyboardMarkup(row_width=2)
    for pid, p in PRODUCTS.items():
        kb.add(InlineKeyboardButton(
            f"{p['emoji']} {p['name']} — {fmt_rupiah(p['price'])}",
            callback_data=f"buy:{pid}"
        ))
    return kb

def payment_keyboard(order_id: str) -> InlineKeyboardMarkup:
    kb = InlineKeyboardMarkup(row_width=2)
    kb.add(
        InlineKeyboardButton("💳 DANA", callback_data=f"pay:dana:{order_id}"),
        InlineKeyboardButton("📱 QR Code (QRIS)", callback_data=f"pay:qr:{order_id}")
    )
    kb.add(InlineKeyboardButton("❌ Batal", callback_data=f"cancel:{order_id}"))
    return kb

def admin_confirm_kb(order_id: str) -> InlineKeyboardMarkup:
    kb = InlineKeyboardMarkup(row_width=2)
    kb.add(
        InlineKeyboardButton("✅ Kirim QR ke Pembeli", callback_data=f"admin:sendqr:{order_id}"),
        InlineKeyboardButton("❌ Tolak", callback_data=f"admin:reject:{order_id}")
    )
    return kb

def admin_payment_received_kb(order_id: str) -> InlineKeyboardMarkup:
    kb = InlineKeyboardMarkup(row_width=2)
    kb.add(
        InlineKeyboardButton("✅ Konfirmasi Bayar Masuk", callback_data=f"admin:confirm:{order_id}"),
        InlineKeyboardButton("❌ Bayar Belum Masuk", callback_data=f"admin:notpaid:{order_id}")
    )
    return kb

# =====================
# /start
# =====================
@bot.message_handler(commands=["start"])
def cmd_start(msg):
    text = (
        "👋 *Selamat datang di NEXO Store Bot!*\n\n"
        "Bot ini menghubungkan kamu langsung dengan toko kami.\n\n"
        "📋 *Perintah tersedia:*\n"
        "• /produk — Lihat daftar produk\n"
        "• /status — Cek status pesananmu\n"
        "• /bantuan — Bantuan & info kontak\n\n"
        "Ketuk /produk untuk mulai belanja! 🛍️"
    )
    bot.send_message(msg.chat.id, text, parse_mode="Markdown")

@bot.message_handler(commands=["produk"])
def cmd_produk(msg):
    bot.send_message(
        msg.chat.id,
        "🛒 *Pilih produk yang ingin kamu beli:*\n\nKetuk tombol di bawah ini 👇",
        parse_mode="Markdown",
        reply_markup=product_keyboard()
    )

@bot.message_handler(commands=["bantuan"])
def cmd_bantuan(msg):
    bot.send_message(
        msg.chat.id,
        "🆘 *Bantuan NEXO Store*\n\n"
        "📧 Email: support@nexo.store\n"
        "💬 Hubungi admin langsung dari toko\n\n"
        "Ketuk /produk untuk belanja!",
        parse_mode="Markdown"
    )

@bot.message_handler(commands=["status"])
def cmd_status(msg):
    buyer_orders = {
        oid: o for oid, o in orders.items()
        if o.get("buyer_id") == msg.chat.id
    }
    if not buyer_orders:
        bot.send_message(msg.chat.id, "📭 Kamu belum punya pesanan aktif.\n\nKetuk /produk untuk mulai belanja!")
        return

    text = "📦 *Pesanan kamu:*\n\n"
    for oid, o in buyer_orders.items():
        status_emoji = {
            "pending_admin": "⏳", "waiting_payment": "💳",
            "waiting_confirm": "🔍", "done": "✅", "cancelled": "❌"
        }.get(o["status"], "❓")
        text += (
            f"{status_emoji} *{oid}* — {o['product']['name']}\n"
            f"   Harga: {fmt_rupiah(o['price'])} | Status: {o['status'].replace('_',' ').title()}\n\n"
        )
    bot.send_message(msg.chat.id, text, parse_mode="Markdown")

# =====================
# CALLBACK HANDLER
# =====================
@bot.callback_query_handler(func=lambda c: True)
def handle_callback(call):
    data = call.data
    cid  = call.message.chat.id

    # ── Pembeli memilih produk ──
    if data.startswith("buy:"):
        pid = data.split(":", 1)[1]
        product = PRODUCTS.get(pid)
        if not product:
            bot.answer_callback_query(call.id, "Produk tidak ditemukan.")
            return

        order_id = next_order_id()
        orders[order_id] = {
            "buyer_id": cid,
            "buyer_name": call.from_user.first_name or "Pembeli",
            "buyer_username": call.from_user.username or "-",
            "product": product,
            "product_id": pid,
            "price": product["price"],
            "method": None,
            "email": None,
            "status": "pending_method",
            "admin_msg_id": None,
        }

        bot.edit_message_text(
            chat_id=cid,
            message_id=call.message.message_id,
            text=(
                f"🛒 *Detail Pesanan*\n\n"
                f"{product['emoji']} *{product['name']}*\n"
                f"📝 {product['description']}\n"
                f"💰 Harga: *{fmt_rupiah(product['price'])}*\n\n"
                f"📌 Order ID: `{order_id}`\n\n"
                f"*Pilih metode pembayaran:*"
            ),
            parse_mode="Markdown",
            reply_markup=payment_keyboard(order_id)
        )
        bot.answer_callback_query(call.id)

    # ── Pembeli memilih metode pembayaran ──
    elif data.startswith("pay:"):
        _, method, order_id = data.split(":", 2)
        order = orders.get(order_id)
        if not order or order["buyer_id"] != cid:
            bot.answer_callback_query(call.id, "Pesanan tidak ditemukan.")
            return

        order["method"] = method
        order["status"] = "pending_email"

        # Minta email pembeli
        bot.edit_message_text(
            chat_id=cid,
            message_id=call.message.message_id,
            text=(
                f"📧 *Masukkan alamat Gmail kamu*\n\n"
                f"Produk akan dikirimkan ke email tersebut setelah pembayaran dikonfirmasi.\n\n"
                f"💡 Contoh: `namakamu@gmail.com`\n\n"
                f"Balas pesan ini dengan Gmail kamu 👇"
            ),
            parse_mode="Markdown"
        )
        # Simpan state tunggu email
        orders[order_id]["waiting_email"] = True
        bot.answer_callback_query(call.id)

    # ── Pembeli konfirmasi sudah bayar (DANA) ──
    elif data.startswith("buyer:paid:"):
        order_id = data.split(":", 2)[2]
        order = orders.get(order_id)
        if not order or order["buyer_id"] != cid:
            bot.answer_callback_query(call.id, "Pesanan tidak ditemukan.")
            return

        order["status"] = "waiting_confirm"
        bot.edit_message_text(
            chat_id=cid,
            message_id=call.message.message_id,
            text=(
                f"⏳ *Pembayaran sedang diverifikasi*\n\n"
                f"Order: `{order_id}`\n"
                f"Admin kami akan mengkonfirmasi pembayaran kamu segera.\n\n"
                f"Kamu akan mendapatkan notifikasi dan produk dikirim ke Gmail setelah dikonfirmasi. ✅"
            ),
            parse_mode="Markdown"
        )

        # Notif admin: ada yang klaim sudah bayar
        admin_confirm_text = (
            f"🔍 *VERIFIKASI PEMBAYARAN*\n\n"
            f"Order: `{order_id}`\n"
            f"Pembeli: {order['buyer_name']} (@{order['buyer_username']})\n"
            f"Produk: {order['product']['name']}\n"
            f"Harga: {fmt_rupiah(order['price'])}\n"
            f"Metode: {order['method'].upper()}\n"
            f"Gmail: {order.get('email', '-')}\n\n"
            f"⚠️ Pembeli mengklaim sudah transfer. Cek mutasi rekening/DANA kamu!"
        )
        bot.send_message(
            ADMIN_ID, admin_confirm_text,
            parse_mode="Markdown",
            reply_markup=admin_payment_received_kb(order_id)
        )
        bot.answer_callback_query(call.id, "Menunggu konfirmasi admin...")

    # ── ADMIN: Kirim QR ke pembeli ──
    elif data.startswith("admin:sendqr:"):
        if cid != ADMIN_ID:
            bot.answer_callback_query(call.id, "Bukan admin.")
            return
        order_id = data.split(":", 2)[2]
        order = orders.get(order_id)
        if not order:
            bot.answer_callback_query(call.id, "Order tidak ditemukan.")
            return

        order["status"] = "waiting_payment"

        method = order["method"]
        buyer_id = order["buyer_id"]
        price = order["price"]
        product = order["product"]

        if method == "qr":
            # Kirim QR ke pembeli
            try:
                bot.send_photo(
                    buyer_id,
                    photo=QR_IMAGE_URL,
                    caption=(
                        f"📱 *QR Code Pembayaran NEXO*\n\n"
                        f"🛒 Produk: {product['name']}\n"
                        f"💰 Nominal: *{fmt_rupiah(price)}*\n"
                        f"📌 Order: `{order_id}`\n\n"
                        f"Scan QR di atas menggunakan aplikasi dompet digital kamu, "
                        f"lalu ketuk tombol di bawah setelah selesai transfer. ✅"
                    ),
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup().add(
                        InlineKeyboardButton("✅ Saya Sudah Transfer", callback_data=f"buyer:paid:{order_id}")
                    )
                )
            except Exception as e:
                log.error(f"Gagal kirim QR: {e}")
                bot.send_message(
                    buyer_id,
                    f"📱 *Pembayaran QR Code*\n\nNominal: *{fmt_rupiah(price)}*\nOrder: `{order_id}`\n\n"
                    f"Silakan scan QR di aplikasi dompet digitalmu. Setelah transfer, klik tombol berikut:",
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup().add(
                        InlineKeyboardButton("✅ Saya Sudah Transfer", callback_data=f"buyer:paid:{order_id}")
                    )
                )
        else:  # DANA
            bot.send_message(
                buyer_id,
                f"💳 *Pembayaran via DANA*\n\n"
                f"🛒 Produk: {product['name']}\n"
                f"💰 Transfer: *{fmt_rupiah(price)}*\n"
                f"📲 Nomor DANA: `{DANA_NUMBER}`\n"
                f"📌 Berita: `{order_id}`\n\n"
                f"Setelah transfer, klik tombol di bawah ini ✅",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup().add(
                    InlineKeyboardButton("✅ Saya Sudah Transfer", callback_data=f"buyer:paid:{order_id}")
                )
            )

        # Update pesan admin
        bot.edit_message_text(
            chat_id=ADMIN_ID,
            message_id=call.message.message_id,
            text=(
                f"✅ *QR/instruksi pembayaran sudah dikirim ke pembeli*\n\n"
                f"Order: `{order_id}` | Menunggu konfirmasi pembayaran..."
            ),
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "QR/instruksi berhasil dikirim ke pembeli!")

    # ── ADMIN: Tolak pesanan ──
    elif data.startswith("admin:reject:"):
        if cid != ADMIN_ID:
            bot.answer_callback_query(call.id, "Bukan admin.")
            return
        order_id = data.split(":", 2)[2]
        order = orders.get(order_id)
        if not order:
            bot.answer_callback_query(call.id, "Order tidak ditemukan.")
            return

        order["status"] = "cancelled"
        bot.send_message(
            order["buyer_id"],
            f"❌ *Pesanan Ditolak*\n\nOrder `{order_id}` dibatalkan oleh admin.\nHubungi kami jika ada pertanyaan.",
            parse_mode="Markdown"
        )
        bot.edit_message_text(
            chat_id=ADMIN_ID,
            message_id=call.message.message_id,
            text=f"❌ Order `{order_id}` ditolak dan dibatalkan.",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "Order dibatalkan.")

    # ── ADMIN: Konfirmasi pembayaran masuk → kirim produk ke Gmail ──
    elif data.startswith("admin:confirm:"):
        if cid != ADMIN_ID:
            bot.answer_callback_query(call.id, "Bukan admin.")
            return
        order_id = data.split(":", 2)[2]
        order = orders.get(order_id)
        if not order:
            bot.answer_callback_query(call.id, "Order tidak ditemukan.")
            return

        order["status"] = "done"
        email = order.get("email")
        product = order["product"]
        buyer_id = order["buyer_id"]

        # Kirim produk ke Gmail pembeli
        email_success = False
        if email:
            email_success = kirim_produk_email(email, order_id, product, order["price"])

        # Notif ke pembeli
        if email_success:
            bot.send_message(
                buyer_id,
                f"🎉 *Pembayaran Berhasil Dikonfirmasi!*\n\n"
                f"✅ Order: `{order_id}`\n"
                f"📦 Produk: {product['name']}\n\n"
                f"📧 Produk telah dikirimkan ke Gmail kamu:\n`{email}`\n\n"
                f"Cek inbox (atau folder spam) dalam beberapa menit.\n"
                f"Terima kasih sudah berbelanja di NEXO! 🙏",
                parse_mode="Markdown"
            )
        else:
            bot.send_message(
                buyer_id,
                f"🎉 *Pembayaran Berhasil Dikonfirmasi!*\n\n"
                f"✅ Order: `{order_id}`\n"
                f"📦 Produk: {product['name']}\n\n"
                f"⚠️ Ada kendala pengiriman email. Admin akan menghubungi kamu segera.\n"
                f"Terima kasih sudah berbelanja di NEXO! 🙏",
                parse_mode="Markdown"
            )

        # Update pesan admin
        status_email = f"✅ Email terkirim ke {email}" if email_success else "⚠️ Gagal kirim email — kirim manual!"
        bot.edit_message_text(
            chat_id=ADMIN_ID,
            message_id=call.message.message_id,
            text=(
                f"✅ *Pembayaran dikonfirmasi — Order Selesai*\n\n"
                f"Order: `{order_id}`\n"
                f"Pembeli: {order['buyer_name']}\n"
                f"Produk: {product['name']}\n"
                f"Email: {email or '-'}\n\n"
                f"{status_email}"
            ),
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "✅ Order selesai! Produk dikirim ke Gmail pembeli.")

    # ── ADMIN: Pembayaran belum masuk ──
    elif data.startswith("admin:notpaid:"):
        if cid != ADMIN_ID:
            bot.answer_callback_query(call.id, "Bukan admin.")
            return
        order_id = data.split(":", 2)[2]
        order = orders.get(order_id)
        if not order:
            bot.answer_callback_query(call.id, "Order tidak ditemukan.")
            return

        order["status"] = "waiting_payment"
        bot.send_message(
            order["buyer_id"],
            f"⚠️ *Pembayaran belum terdeteksi*\n\n"
            f"Order: `{order_id}`\n\n"
            f"Mohon pastikan transfer sudah dilakukan dengan nominal dan nomor tujuan yang benar.\n"
            f"Jika sudah transfer, tunggu beberapa menit lalu klik tombol *Sudah Transfer* lagi.\n\n"
            f"Atau hubungi admin untuk bantuan.",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup().add(
                InlineKeyboardButton("✅ Saya Sudah Transfer (Coba Lagi)", callback_data=f"buyer:paid:{order_id}")
            )
        )
        bot.edit_message_text(
            chat_id=ADMIN_ID,
            message_id=call.message.message_id,
            text=f"⚠️ Order `{order_id}` — pembayaran belum dikonfirmasi. Menunggu pembeli kirim ulang konfirmasi.",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "Pembeli dinotifikasi.")

    # ── Batal ──
    elif data.startswith("cancel:"):
        order_id = data.split(":", 1)[1]
        order = orders.get(order_id)
        if order and order["buyer_id"] == cid:
            order["status"] = "cancelled"
        bot.edit_message_text(
            chat_id=cid,
            message_id=call.message.message_id,
            text="❌ Pesanan dibatalkan. Ketuk /produk untuk belanja lagi.",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "Pesanan dibatalkan.")

# =====================
# TERIMA EMAIL DARI PEMBELI (pesan teks biasa)
# =====================
@bot.message_handler(func=lambda m: True)
def handle_text(msg):
    cid = msg.chat.id
    text = msg.text.strip()

    # Cari order yang menunggu email untuk user ini
    pending = None
    pending_oid = None
    for oid, o in orders.items():
        if o.get("buyer_id") == cid and o.get("waiting_email"):
            pending = o
            pending_oid = oid
            break

    if pending:
        # Validasi format email sederhana
        if "@" not in text or "." not in text.split("@")[-1]:
            bot.send_message(
                cid,
                "⚠️ Format email tidak valid. Contoh yang benar: `namakamu@gmail.com`\n\nCoba lagi 👇",
                parse_mode="Markdown"
            )
            return

        pending["email"] = text.lower()
        pending["waiting_email"] = False
        pending["status"] = "pending_admin"

        method_label = "QR Code (QRIS)" if pending["method"] == "qr" else "DANA"

        # Konfirmasi ke pembeli
        bot.send_message(
            cid,
            f"✅ *Pesanan Diterima!*\n\n"
            f"📌 Order ID: `{pending_oid}`\n"
            f"📦 Produk: {pending['product']['name']}\n"
            f"💰 Harga: {fmt_rupiah(pending['price'])}\n"
            f"💳 Metode: {method_label}\n"
            f"📧 Gmail: `{pending['email']}`\n\n"
            f"⏳ Menunggu admin memproses pesananmu...\n"
            f"Kamu akan segera menerima instruksi pembayaran!",
            parse_mode="Markdown"
        )

        # Kirim notifikasi ke admin
        admin_text = (
            f"🛒 *PESANAN BARU!*\n\n"
            f"📌 Order: `{pending_oid}`\n"
            f"👤 Pembeli: {pending['buyer_name']} (@{pending['buyer_username']})\n"
            f"🆔 User ID: `{cid}`\n"
            f"📦 Produk: {pending['product']['emoji']} {pending['product']['name']}\n"
            f"💰 Harga: *{fmt_rupiah(pending['price'])}*\n"
            f"💳 Metode: *{method_label}*\n"
            f"📧 Gmail: `{pending['email']}`\n\n"
            f"👇 Klik tombol di bawah untuk kirim instruksi pembayaran ke pembeli:"
        )
        sent = bot.send_message(
            ADMIN_ID, admin_text,
            parse_mode="Markdown",
            reply_markup=admin_confirm_kb(pending_oid)
        )
        pending["admin_msg_id"] = sent.message_id
        return

    # Pesan umum — arahkan ke produk
    bot.send_message(
        cid,
        "👋 Halo! Ketuk /produk untuk melihat daftar produk kami, atau /bantuan untuk bantuan.",
    )

# =====================
# KIRIM PRODUK VIA GMAIL
# =====================
def kirim_produk_email(to_email: str, order_id: str, product: dict, price: int) -> bool:
    """Kirim konten produk ke Gmail pembeli."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"✅ Pesanan #{order_id} — {product['name']} | NEXO Store"
        msg["From"]    = f"NEXO Store <{GMAIL_USER}>"
        msg["To"]      = to_email

        # Konten produk (isi placeholder)
        product_content = product["file_content"].replace("{order_id}", order_id)

        # Plain text
        plain = (
            f"Halo!\n\n"
            f"Terima kasih sudah berbelanja di NEXO Store.\n"
            f"Pembayaran kamu untuk order #{order_id} sudah dikonfirmasi.\n\n"
            f"=== DETAIL PRODUK ===\n"
            f"{product_content}\n\n"
            f"=========================\n"
            f"Nominal: {fmt_rupiah(price)}\n"
            f"Order ID: {order_id}\n\n"
            f"Salam,\nTim NEXO Store\nsupport@nexo.store"
        )

        # HTML email
        html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#0e1525;border-radius:18px;overflow:hidden;border:1px solid rgba(123,95,255,0.3)">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#7B5FFF,#00D9FF);padding:32px;text-align:center">
    <div style="font-size:2rem;font-weight:900;color:#fff;letter-spacing:-1px">NEXO</div>
    <div style="color:rgba(255,255,255,0.85);font-size:0.85rem;margin-top:4px">Store & Digital Services</div>
  </div>
  <!-- Body -->
  <div style="padding:32px">
    <div style="background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.3);border-radius:12px;padding:16px;margin-bottom:24px;text-align:center">
      <div style="font-size:2rem">✅</div>
      <div style="color:#00e676;font-weight:700;font-size:1.1rem;margin-top:8px">Pembayaran Berhasil!</div>
    </div>
    <p style="color:#94a3b8;font-size:0.9rem;line-height:1.7;margin-bottom:20px">
      Halo! Terima kasih sudah berbelanja di <strong style="color:#7B5FFF">NEXO Store</strong>. 
      Pesananmu sudah dikonfirmasi. 🎉
    </p>
    <!-- Produk -->
    <div style="background:rgba(123,95,255,0.08);border:1px solid rgba(123,95,255,0.2);border-radius:14px;padding:20px;margin-bottom:20px">
      <div style="font-size:2rem;margin-bottom:10px">{product['emoji']}</div>
      <div style="color:#e2e8f8;font-weight:700;font-size:1rem;margin-bottom:6px">{product['name']}</div>
      <div style="color:#64748b;font-size:0.82rem;line-height:1.6;white-space:pre-line">{product_content}</div>
    </div>
    <!-- Detail Order -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr style="border-bottom:1px solid rgba(123,95,255,0.1)">
        <td style="padding:10px 0;color:#64748b;font-size:0.82rem">Order ID</td>
        <td style="padding:10px 0;color:#e2e8f8;font-size:0.82rem;text-align:right;font-weight:600">{order_id}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:0.82rem">Total Pembayaran</td>
        <td style="padding:10px 0;color:#00D9FF;font-size:1rem;text-align:right;font-weight:700">{fmt_rupiah(price)}</td>
      </tr>
    </table>
    <p style="color:#475569;font-size:0.78rem;text-align:center;line-height:1.6">
      Pertanyaan? Hubungi kami di <a href="mailto:support@nexo.store" style="color:#7B5FFF">support@nexo.store</a>
    </p>
  </div>
  <!-- Footer -->
  <div style="background:rgba(0,0,0,0.2);padding:16px;text-align:center">
    <div style="color:#334155;font-size:0.72rem">© 2025 NEXO Store — All rights reserved</div>
  </div>
</div>
</body>
</html>
"""
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
            smtp.login(GMAIL_USER, GMAIL_PASS)
            smtp.sendmail(GMAIL_USER, to_email, msg.as_string())

        log.info(f"Email produk {order_id} terkirim ke {to_email}")
        return True

    except smtplib.SMTPAuthenticationError:
        log.error("GMAIL AUTH GAGAL — Pastikan App Password benar dan Less Secure App / 2FA aktif")
        return False
    except Exception as e:
        log.error(f"Gagal kirim email: {e}")
        return False

# =====================
# MAIN
# =====================
if __name__ == "__main__":
    log.info("🤖 NEXO Bot berjalan...")
    log.info(f"   Admin ID : {ADMIN_ID}")
    log.info(f"   Gmail    : {GMAIL_USER}")
    log.info(f"   DANA     : {DANA_NUMBER}")
    bot.infinity_polling(timeout=30, long_polling_timeout=30)
