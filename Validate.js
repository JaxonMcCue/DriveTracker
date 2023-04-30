import { Alert } from "react-native";
import { isUndefined } from "lodash";
import React, { useState, useEffect } from "react";

export function timeValidation(saveTime1, saveTime2) {
  let isValid = true;
  let time1 = saveTime1.toString();
  let time2 = saveTime2.toString();
  var hour1 = Number(time1.toString().split(":")[0]);
  var hour2 = Number(time2.split(":")[0]);
  var min1 = Number(time1.split(":")[1]);
  var min2 = Number(time2.split(":")[1]);
  if (isNaN(hour1) || isNaN(hour2)) {
    Alert.alert(
      "Error Saving Data",
      "Only numbers can be used to create times"
    );
    isValid = false;
  } else if (hour1 < 1 || hour2 < 1 || hour1 > 12 || hour2 > 12) {
    Alert.alert(
      "Error Saving Data",
      "Make sure you have entered your times properly!"
    );
    isValid = false;
  } else if (min1 > 59 || min2 > 59 || min1 < 0 || min2 < 0) {
    Alert.alert(
      "Error Saving Data",
      "Minutes are outside the range acceptable (00-59)"
    );
    isValid = false;
  } else if (
    (isNaN(min1) && !isUndefined(time1.split(":")[1])) ||
    (isNaN(min2) && !isUndefined(time2.split(":")[1]))
  ) {
    Alert.alert(
      "Error Saving Data",
      "Only numbers can be used to create times"
    );
    isValid = false;
  }
  return isValid;
}

//imperfect, struggle to figure out what to do if someone only did one number on left side of :
export function timeDisplayMin(hour, min) {
  if (isUndefined(min) || Number(min) === 0) {
    return hour + ":00";
  } else if (Number(min) < 10) {
    return hour + ":0" + Number(min).toString();
  } else {
    return hour + ":" + min;
  }
}
