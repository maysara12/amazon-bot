from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route("/run-bot", methods=["GET"])
def run_bot():
    try:
        subprocess.Popen(["python", "bot.py"])
        return jsonify({
            "status": "success",
            "message": "Bot started"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        })


@app.route("/")
def home():
    return "Amazon Bot Server Running"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)