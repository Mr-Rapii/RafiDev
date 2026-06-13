import os
import telebot
import smtplib
from email.message import EmailMessage

# Mengambil rahasia dari environment (yang berasal dari GitHub Secrets)
BOT_TOKEN = os.environ.get("BOT_TOKEN")
GMAIL_PASS = os.environ.get("GMAIL_PASSWORD")
GMAIL_USER = "email-anda@gmail.com" # Ganti email Anda

bot = telebot.TeleBot(BOT_TOKEN)

def kirim_email(tujuan, produk):
    msg = EmailMessage()
    msg.set_content(f"Halo! Ini produk NEXO Anda: {produk}")
    msg['Subject'] = "Pesanan NEXO Store"
    msg['From'] = GMAIL_USER
    msg['To'] = tujuan
    
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(GMAIL_USER, GMAIL_PASS)
        smtp.send_message(msg)

# Bot akan kirim pesan ke Telegram Anda
def notifikasi_telegram(customer, email, produk):
    pesan = f"🛒 Pesanan Baru!\nPelanggan: {customer}\nEmail: {email}\nProduk: {produk}"
    bot.send_message("ID_TELEGRAM_ANDA", pesan)

# Anda bisa menambahkan fungsi callback_query di sini nanti 
# untuk konfirmasi pembayaran dari Telegram.
