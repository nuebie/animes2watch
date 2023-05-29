from flask import Flask, render_template, request, flash, send_from_directory
import os
import pandas as pd
import pickle
from surprise import Dataset
from surprise import KNNBasic
from surprise import Reader
from surprise import KNNBasic
from surprise import SVD
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
trainedmodel = pickle.load(open('templates/trainedmodel.pkl', 'rb')) # Load the trained model
reader = Reader(rating_scale=(1, 5))  #Define the Reader object to read the files

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
    data = request.json  # Get the data passed from the JavaScript file

    # Process the data and make recommendations using the trained model
    # Convert the JSON data to a pandas DataFrame
    df = pd.DataFrame(data['ratings'])

    # Reorder the columns if necessary
    new_user_preferences = df[['userid', 'itemid', 'rating']]

    # Append the new user preferences to the original animelist dataset
    updated_animelist_df = pd.concat([animelist_df, new_user_preferences])

    # Load the dataset using the Reader object
    data = Dataset.load_from_df(updated_animelist_df, reader=reader)

    # Retrieve the trainset.
    trainset = data.build_full_trainset()

    # Train the algorithm on the training set
    trainedmodel.fit(trainset)

    # get the list of the movie ids
    unique_ids = animelist_df['itemid'].unique()

    # get the list of the ids that the userid 13618 has watched
    iids1001 = updated_animelist_df.loc[updated_animelist_df['userid']==-1, 'itemid']

    # remove the rated movies for the recommendations
    movies_to_predict = np.setdiff1d(unique_ids,iids1001)

    my_recs = []
    for iid in movies_to_predict:
        my_recs.append((iid, trainedmodel.predict(uid=-1,iid=iid).est))
        recom_df = pd.DataFrame(my_recs, columns=['itemid', 'predictions']).sort_values('predictions', ascending=False).head(10)


    # Convert the DataFrame to JSON
    recom_json = recom_df.to_json(orient='records')

    # Return the JSON response
    return recom_json
