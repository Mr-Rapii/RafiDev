from flask import Flask, render_template, request, jsonify
import requests
import base64

app = Flask(__name__)

# API Key diletakkan di backend agar aman dari inspeksi browser
API_KEY = "FJeWdfdFMymyWdZbuoiHYqya"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/proses-removebg', methods=['POST'])
def proses_removebg():
    # Mengecek apakah ada file gambar yang dikirim dari browser
    if 'image_file' not in request.files:
        return jsonify({'error': 'Tidak ada gambar yang diunggah'}), 400
    
    file = request.files['image_file']
    
    # Backend Python yang menembak API Remove.bg secara rahasia
    response = requests.post(
        'https://api.remove.bg/v1.0/removebg',
        files={'image_file': (file.filename, file.read(), file.content_type)},
        data={'size': 'auto'},
        headers={'X-Api-Key': API_KEY},
    )
    
    # Jika sukses, gambar diubah jadi teks (base64) agar mudah dikirim balik ke browser
    if response.status_code == requests.codes.ok:
        img_str = base64.b64encode(response.content).decode('utf-8')
        return jsonify({'success': True, 'image_data': img_str})
    else:
        return jsonify({'error': 'Gagal memproses gambar dari API'}), int(response.status_code)

if __name__ == '__main__':
    app.run(debug=True)
