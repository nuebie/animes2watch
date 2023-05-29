from flask import Flask, render_template, request, flash, send_from_directory
import os
import pandas as pd
import pickle
import json
import numpy as np


app = Flask(__name__, static_folder='static')

# Define a helper function to add CORS headers to responses
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'  # Adjust the origin value if needed
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    return response

# Apply the CORS headers to all routes
app.after_request(add_cors_headers)

animelist_df = pd.read_csv("templates/animelist_updated_1m_v3.csv")  # Load the anime list into a DataFrame
#trainedmodel = pickle.load(open('templates/trainedmodel.pkl', 'rb')) # Load the trained model
#reader = Reader(rating_scale=(1, 5))  #Define the Reader object to read the files

@app.route('/')
def index():
    return render_template('index.html')

# Define endpoint for serving files from the 'dist' directory
@app.route('/dist/<path:filename>')
def serve_dist(filename):
    root_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(root_dir, 'dist')
    return send_from_directory(dist_dir, filename)

@app.route('/recommend', methods=['POST'])
def recommend():
    data = {
    'itemid': [6945, 33281, 31722, 16680, 30276],
    'predictions': [0.8, 0.6, 0.9, 0.7, 0.5]
    }

    df = pd.DataFrame(data)

    # Convert the DataFrame to JSON
    recom_json = df.to_json(orient='records')

    # Return the JSON response
    return recom_json
