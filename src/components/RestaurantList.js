import React, { useState, useEffect, useContext } from "react";
import NotLiked from "./NotLiked";
import Liked from "./Liked";
import { UserLoggedInContext } from "../context/UserLoggedIn";
import { AllRestaurantsContext } from "../context/AllRestaurants";
import { DataStore } from '@aws-amplify/datastore';
import { User } from '../models';



function RestaurantList({ allUsers, currentPath, loggedIn }) {
  let likedArray = []
  const [currentUser, setCurrentUser] = useContext(UserLoggedInContext); //username is set to currentUser
  const [allRestaurants] = useContext(AllRestaurantsContext);
  
  //then we can do a filter where we return id
  const userID = allUsers.filter((user) => {
    return user.username === currentUser;
  });


  const [likedRes, setLikedRes] = useState([]);
  const [dislikedRes, setDislikedRes] = useState(allRestaurants);
  const [disable, setDisable] = useState(true); //disable Like button after a click
  const [disableDislike, setDisbaleDislike] = useState(false);


  useEffect(() => {
    //if there is a userID and the restaurants are loaded run the if statement
    if (userID.length && allRestaurants.length) {
      let likedListOfUser = userID[0].liked;
      //we do a filter on allrestaurants to filter what has been liked already
      let alreadyLiked = allRestaurants.filter((res) => {
        return likedListOfUser.includes(res.id);
      });
      let noLiked = allRestaurants.filter((res) => {
        return !likedListOfUser.includes(res.id);
      });
      setLikedRes(alreadyLiked); //we're setting the number 1 and 2. Not the restaurant data
      likedArray = likedListOfUser;
      setDislikedRes((dislikedRes) => noLiked);
      setDisable((disable) => false);
    } else {
      setDislikedRes(allRestaurants);
    }

    const userLoggedBefore = localStorage.getItem("username");
    if (userLoggedBefore === null) {
    } else if (userLoggedBefore.length) {
      setCurrentUser(userLoggedBefore);
    }

    //we're setting the number 1 and 2. Not the restaurant data
  }, [currentUser, currentPath, allRestaurants]); //dependency on username change, link change, and all restaurants being updated

  //console.log(likedRes);

  // when like button gets clicked, clicked data gets sent to this function
  function handleLike(data) {
    // filter all restaurant and return all except for the one that we liked
    const filteredLike = dislikedRes.filter((res) => {
      return res.id !== data.id;
    });

    likedArray = userID[0].liked

    let copyLikedArray = [...likedArray]
    //add the restaurant id to the liked array
    copyLikedArray.push(data.id);


    const updateUserLiked = async () => {
      const original = await DataStore.query(User, userID[0].id)
      let copyOriginal = [...original.liked]
      copyOriginal.push(data.id)
      /* Models in DataStore are immutable. To update a record you must use the copyOf function
      to apply updates to the item’s fields rather than mutating the instance directly */
      await DataStore.save(User.copyOf(original, updated => {
        updated.liked = copyOriginal
      }));
    }

    //updated liked array for the current user
    updateUserLiked()


    let alreadyLiked = allRestaurants.filter((res) => {
      return copyLikedArray.includes(res.id);
    });

    // push the data that we liked to liked restauarant list
    setLikedRes(alreadyLiked);
    // we set all restaurant to show all excepte for the one that we like
    setDislikedRes((dislikedRes) => filteredLike);
    //disable the like button
    //document.querySelector("#like_button").disabled = true;
  }
  // when dislike button gets clicked, clicked data gets sent to this function
  function handleDisLike(data) {
    console.log(data);
    // filter liked restaurant list and return all except for the one that we disliked
    const filteredRes = likedRes.filter((res) => {
      return res.id !== data.id;
    });
    // updaate liked restaurant list to show all except the one that we disliked
    setLikedRes((likedRes) => filteredRes);
    // we update the data that we disliked to all restaurant list
    setDislikedRes([...dislikedRes, data]);
    //disable dislike button
    // setDisbaleDislike(true);

    likedArray = userID[0].liked
    let copyLikedArray = [...likedArray]
    //we're going to take liked array and remove the one taht has been disliked
    //need to find index of the dislike one
    let dislikedIDIndex = copyLikedArray.indexOf(data.id);
    copyLikedArray.splice(+dislikedIDIndex, 1);

    const updateUserLiked = async () => {
      const original = await DataStore.query(User, userID[0].id)
      let copyOriginal = [...original.liked]
      let disLikedIDIndex = copyOriginal.indexOf(data.id)
      copyOriginal.splice(+disLikedIDIndex,1)
      /* Models in DataStore are immutable. To update a record you must use the copyOf function
      to apply updates to the item’s fields rather than mutating the instance directly */
      await DataStore.save(User.copyOf(original, updated => {
        updated.liked = copyOriginal
      }));
    }

    //updated liked array for the current user
    updateUserLiked()
  }

  return (
    <div id="restaurant">
      <Liked
        likedRes={likedRes}
        handleLike={handleLike}
        handleDisLike={handleDisLike}
        disable={disable}
        disableDislike={disableDislike}
        loggedIn={loggedIn}
      />
      <NotLiked
        dislikedRes={dislikedRes}
        handleLike={handleLike}
        handleDisLike={handleDisLike}
        disableDislike={disableDislike}
        disable={disable}
        loggedIn={loggedIn}
      />
    </div>
  );
}

export default RestaurantList;
