// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
    getFirestore, collection, getDocs, doc, setDoc, addDoc,
    query, where, limit
} from 'firebase/firestore'


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDwUodi-eIHicNgrRDzOp_SIPfM12dXMy4",
  authDomain: "anime-recommendation-v2.firebaseapp.com",
  projectId: "anime-recommendation-v2",
  storageBucket: "anime-recommendation-v2.appspot.com",
  messagingSenderId: "677280409767",
  appId: "1:677280409767:web:83f815220bda9bc3fed382",
  measurementId: "G-4X4WZG3YGN"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


const inputField = document.getElementById('searchinput');
const displayContainer = document.getElementById('searchlist');
const ratingContainer = document.getElementById('selectedanimelist');
const submitbutton = document.getElementById('submitbutton');
const recommendationcontainer = document.getElementById('recommendationlist');
const loadercontainer = document.getElementById('loadercontainer');
const trybutton = document.getElementById('trybutton');

submitbutton.style.display = 'none';
loadercontainer.style.display = 'none';


// Add an event listener for the try button
trybutton.addEventListener('click', () => {
  // Get the target div element
  const targetDiv = document.getElementById('div3');

  // Scroll to the target div
  targetDiv.scrollIntoView({ behavior: 'smooth' });
});


//SEARCH DATABASE FOR ANIME TITLES
inputField.addEventListener('input', async event => {
  const searchQuery = event.target.value.trim();

  // Clear previous search recommendations
  displayContainer.innerHTML = '';

  //If search box is not empty
  if(inputField.value != ''){
    // Query Firestore for search recommendations
    const q = query(collection(db, "anime"), where("englishname", ">=", searchQuery), limit(5));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      console.log(doc.id, " => ", doc.data());
      // Create an HTML element for each search recommendation
      const searchItem = document.createElement('li');
      searchItem.textContent = doc.data().name;
      searchItem.classList.add('searchrecommendation');

      // Set the itemid as the id of the <li> element
      searchItem.id = doc.data().itemid;

      // Append the search recommendation to the display container
      displayContainer.appendChild(searchItem);
    });
  }
});


  // Event listener for clicks on the search recommendations
  displayContainer.addEventListener('click', event => {
    if (event.target.tagName === 'LI') {
      // Clear input field
      inputField.value = '';

      // Clear search recommendations
      displayContainer.innerHTML = '';

      // Get the selected item's information
      const itemid = event.target.id;
      const name = event.target.textContent;

      // Create an <li> element for the rating list
      const ratingItem = document.createElement('li');
      ratingItem.id = itemid;

      const animetitle = document.createElement('span');
      animetitle.textContent = name;
      animetitle.classList.add('animetitle');

      //APPEND THE ANIME TITLE TO THE LIST
      ratingItem.appendChild(animetitle);

      // Create the star rating UI
      const starRating = document.createElement('div');
      starRating.classList.add('star-rating');
      ratingItem.dataset.rating = 1; // Set default rating to 1

      // Create individual stars
      for (let i = 5; i >= 1; i--) {
        const star = document.createElement('span');
        star.textContent = '★';
        star.classList.add('rating__star');
        star.dataset.rating = i;
        star.addEventListener('click', handleRating);
        starRating.appendChild(star);
      }

      // Create remove button
      const removeButton = document.createElement('button');
      removeButton.textContent = 'X';
      removeButton.classList.add('removebutton');
      removeButton.addEventListener('click', removeRatingItem);

      // Append the star rating UI to the rating item
      ratingItem.appendChild(starRating);

      // Append the remove button to the rating item
      ratingItem.appendChild(removeButton);

      // Move the selected item to the rating container
      ratingContainer.appendChild(ratingItem);

      // Check if there are items in the rating container
      const ratingItems = ratingContainer.querySelectorAll('li');
      console.log(ratingItems.length);
      if (ratingItems.length == 0) {
        // Hide the submit button
        submitbutton.style.display = 'none';
      }
      else{
        submitbutton.style.display = 'block';
      }

      // Implement your rating functionality (e.g., star rating)
      // Here, you can add the necessary UI elements for rating (e.g., stars, buttons, etc.)
      // Attach event listeners to handle the rating input and save the rating data to the database
      // You can use the 'itemid' to identify and update the rating for the corresponding item
  }
});

// Event listener to handle the rating input
function handleRating(event) {
  const rating = event.target.dataset.rating;
  const itemid = event.target.parentNode.parentNode.id;

  // Store the rating as a data attribute on the <li> element
  event.target.parentNode.parentNode.dataset.rating = rating;


  // Add 'selected' class to the clicked star and preceding stars
  const stars = event.target.parentNode.querySelectorAll('.rating__star');
  stars.forEach((star) => {
    if (star.dataset.rating <= rating) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });

  // Print the rating in the console
  console.log(`Rating ${rating} for item ${itemid}`);
}


// Event listener to handle the removal of a rating item
function removeRatingItem(event) {
  const ratingItem = event.target.parentNode;
  ratingItem.remove();

  // Check if there are items in the rating container
  const ratingItems = ratingContainer.querySelectorAll('li');
  if (ratingItems.length == 0) {
    // Hide the submit button
    submitbutton.style.display = 'none';
  }
}


// Event listener for the submit button
submitbutton.addEventListener('click', () => {
  // Call the createRatingJSON() function to generate the rating JSON
  const ratingJSON = createRatingJSON();

  // Log the rating JSON in the console
  console.log(ratingJSON);

  // Show the loader
  loadercontainer.style.display = 'flex';

  flaskrequest(ratingJSON);


  // Here, you can proceed with any further actions you want to take with the rating JSON, such as sending it to a server for processing or displaying the recommendations.

  // Reset the rating container
  ratingContainer.innerHTML = '';

  //reset the recommendation container
  recommendationcontainer.innerHTML = '';

  // Check if there are items in the rating container
  const ratingItems = ratingContainer.querySelectorAll('li');
  if (ratingItems.length == 0) {
    // Hide the submit button
    submitbutton.style.display = 'none';
  }
});


// Function to create a JSON object of ratings and item IDs
function createRatingJSON() {
  const ratings = [];
  const userid = -1;
  const ratingItems = ratingContainer.querySelectorAll('li');
  //const ratingItems = ratingContainer.querySelectorAll('.animetitle');

  // Iterate over each rating item and retrieve the rating and item ID
  ratingItems.forEach(ratingItem => {
    const rating = ratingItem.dataset.rating;
    const itemid = ratingItem.id;

    // Create an object with the rating and item ID
    const ratingObj = {
      userid: parseInt(userid),
      itemid: parseInt(itemid),
      rating: parseFloat(rating)
    };

    // Add the rating object to the ratings array
    ratings.push(ratingObj);
  });

  // Create a JSON object with the ratings array
  const ratingJSON = {
    ratings: ratings
  };

  // Return the JSON object
  return ratingJSON;
};


function flaskrequest(ratingJSON){
  // Send a POST request to the Flask server
  $.ajax({
    url: 'http://127.0.0.1:5000/recommend',  // Update the URL with your Flask server address
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(ratingJSON),
    success: function (response) {
      console.log(response);
      // Process the recommendations JSON response
      const recommendations = JSON.parse(response);

      // Extract the itemids from the recommendations
      const itemids = recommendations.map(item => item.itemid);

      // Retrieve the anime titles from the database using the itemids
      getItemTitlesFromDatabase(itemids);
      //console.log(titles);

      // Handle the promise when the titles are retrieved
      /*titlesPromise.then(titles => {
        // Create an <li> element for the rating list
        const recommendationItem = document.createElement('li');
        recommendationItem.textContent = titles;
        recommendationItem.id = titles;

        // Append the search recommendation to the display container
      recommendationcontainer.appendChild(recommendationItem);
      })*/

      /*titlesPromise.forEach(title  => {
        // Create an <li> element for the rating list
        const recommendationItem = document.createElement('li');
        recommendationItem.textContent = title;
        recommendationItem.id = title;

        // Append the search recommendation to the display container
      recommendationcontainer.appendChild(recommendationItem);
      });*/
    }
  });
};

function getItemTitlesFromDatabase(itemids) {
  // Hide the submit button and show the loader
  submitbutton.style.display = 'none';

  // Create a promise for each query
  const promises = itemids.map(itemid =>
    new Promise(async (resolve, reject) => {
      // Query Firestore for search recommendations
      const q = query(collection(db, 'anime'), where('itemid', '==', itemid));

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => {
        // Create an <li> element for the recommendation list
        const recommendationItem = document.createElement('li');
        recommendationItem.textContent = doc.data().englishname;
        recommendationItem.id = doc.data().itemid;

        // Append the search recommendation to the display container
        recommendationcontainer.appendChild(recommendationItem);
      });

      resolve(); // Resolve the promise when the query is done
    })
  );

  // Wait for all promises to be resolved
  Promise.all(promises)
    .then(() => {
      // Hide the loader and show the submit button
      loadercontainer.style.display = 'none';
    })
}


/*function getItemTitlesFromDatabase(itemids) {
  //const titles = [];

  itemids.forEach(async itemid => {
    // Query Firestore for search recommendations
    const q = query(collection(db, "anime"), where("itemid", "==", itemid));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {

      // Create an <li> element for the rating list
      const recommendationItem = document.createElement('li');
      recommendationItem.textContent = doc.data().englishname;
      recommendationItem.id = doc.data().itemid;

      // Append the search recommendation to the display container
      recommendationcontainer.appendChild(recommendationItem);
    });
  });

}*/

  /*getDocs(query)
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        console.log(doc);
        // Create an HTML element for each search recommendation
        const searchItem = document.createElement('li');
        searchItem.textContent = doc.data().name;

        // Append the search recommendation to the display container
        displayContainer.appendChild(searchItem);
      });
    })
  });*/


//Import anime titles into firestore databse
/*fetch('anime.json')
  .then(response => response.json()) // Parse the response as JSON
  .then(data => {
    // Iterate over each object in the array
    data.forEach(async item => {
      //console.log(item.Name);
      await addDoc(collection(db, "anime"), {
        itemid: item.itemID,
        name: item.Name,
        englishname: item.Englishname
      });
    });
  });*/




/*const colref = collection(db, 'anime')
getDocs(colref)
    .then((snapshot) => {
        let anime = []
        snapshot.docs.forEach((doc) => {
            anime.push({...doc.data()})
        })
       console.log(anime)
    })*/
