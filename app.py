from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import base64

app = Flask(__name__)
# Pengaturan Keamanan & Database
app.config['SECRET_KEY'] = 'kunci-rahasia-saas-removebg-123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database_akun.db'

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# API Key Remove.bg Anda
API_KEY = "FJeWdfdFMymyWdZbuoiHYqya"

# --- STRUKTUR TABEL DATABASE ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    koin = db.Column(db.Integer, default=1) # Otomatis dapat 1 koin saat daftar

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- FITUR LOGIN & DAFTAR ---
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Cek apakah username sudah ada
        user = User.query.filter_by(username=username).first()
        if user:
            return render_template('register.html', error="Username sudah dipakai orang lain.")
            
        # Mengacak sandi agar aman di database
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(username=username, password=hashed_password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('home'))
        else:
            return render_template('login.html', error="Username atau kata sandi salah.")
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# --- FITUR UTAMA (Hanya bisa diakses jika sudah login) ---
@app.route('/')
@login_required
def home():
    # Menampilkan halaman utama dan mengirim sisa koin ke frontend
    return render_template('index.html', koin=current_user.koin, username=current_user.username)

@app.route('/proses-removebg', methods=['POST'])
@login_required
def proses_removebg():
    # CEK KOIN: Jika koin habis, tolak permintaan
    if current_user.koin < 1:
        return jsonify({'error': 'Koin Anda habis! Silakan isi ulang koin.'}), 403

    if 'image_file' not in request.files:
        return jsonify({'error': 'Tidak ada gambar yang diunggah'}), 400
    
    file = request.files['image_file']
    
    response = requests.post(
        'https://api.remove.bg/v1.0/removebg',
        files={'image_file': (file.filename, file.read(), file.content_type)},
        data={'size': 'auto'},
        headers={'X-Api-Key': API_KEY},
    )
    
    if response.status_code == requests.codes.ok:
        # POTONG KOIN: Kurangi 1 koin karena proses sukses
        current_user.koin -= 1
        db.session.commit()
        
        img_str = base64.b64encode(response.content).decode('utf-8')
        return jsonify({'success': True, 'image_data': img_str, 'sisa_koin': current_user.koin})
    else:
        return jsonify({'error': 'Gagal dari server Remove.bg'}), int(response.status_code)

if __name__ == '__main__':
    # Otomatis membuat file database.db saat server dinyalakan pertama kali
    with app.app_context():
        db.create_all()
    app.run(debug=True)
        
