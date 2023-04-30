import {
  StatusBar,
  setStatusBarNetworkActivityIndicatorVisible,
} from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
//import moment from "moment";
import * as SplashScreen from "expo-splash-screen";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment/moment";
import { Border, VictoryPie } from "victory-native";
import * as WebBrowser from "expo-web-browser";
import { ProgressBar } from "react-native-paper";
import { reloadAsync } from "expo-updates";
import { isUndefined } from "lodash";

import { timeValidation, timeDisplayMin } from "./Validate.js";

const key = "@MyApp:key";

const Stack = createNativeStackNavigator();
SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

const Day = 40;
const Night = 10;

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSQL: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("DriversDB.db");
  return db;
}

const db = openDatabase();

function Times() {
  const [times, setTimes] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "select id, time1, time2, hours from times order by id desc;",
        [],
        (_, { rows: { _array } }) => setTimes(_array)
      );
    });
  });

  if (times === null || times.length === 0) {
    return null;
  }

  return (
    <View>
      {times.map(({ id, time1, time2, hours }) => (
        <Text key={id} style={styles.hoursItems}>
          Start: {time1}, End: {time2}, Hours: {hours.toFixed(1)}
        </Text>
      ))}
    </View>
  );
}

function HomeScreen({ navigation }) {
  const [time1, setTime1] = useState("");
  const [text, setText] = useState("");

  async function checkText() {
    const storedTime = await AsyncStorage.getItem(key);
    setTime1(storedTime);

    if (time1 === "" || time1 === null) {
      setText("Start");
    } else {
      setText("End");
    }
  }

  async function newValue() {
    try {
      var time = moment().format("HH:mm");
      await AsyncStorage.setItem(key, time);
    } catch (error) {
      Alert.alert("Error");
    }
  }

  save = async () => {
    try {
      //Has value
      const storedTime = await AsyncStorage.getItem(key);
      setTime1(storedTime);

      if (time1 === "" || time1 === null) {
        newValue();
      } else {
        var now = moment().format("HH:mm");
        var hour1 =
          Number(storedTime.split(":")[0]) +
          Number(storedTime.split(":")[1]) / 60;
        var hour2 = Number(now.split(":")[0]) + Number(now.split(":")[1]) / 60;

        var totalHours = 0;
        if (hour2 > hour1) {
          totalHours = hour2 - hour1;
        }
        db.transaction((tx) => {
          tx.executeSql(
            "insert into times (time1, time2, hours) values (?, ?, ?)",
            [time1, now, totalHours]
          );
        });
        await AsyncStorage.setItem(key, "");
      }
    } catch (error) {
      //No value
      newValue();
    }
    checkText();
  };

  checkText();

  return (
    <View style={styles.container}>
      <Image source={require("./images/drivingCar.png")} style={styles.image} />
      <Pressable onPress={() => this.save()}>
        <Text style={styles.button}>{text} Time</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Enter")}>
        <Text style={styles.button}>Enter Manually</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Progress")}>
        <Text style={styles.button}>Progress</Text>
      </Pressable>
    </View>
  );
}

function DataEntry({ navigation }) {
  const [timeDay1, setTimeDay1] = useState("AM");
  const [timeDay2, setTimeDay2] = useState("AM");
  const [time1, setTime1] = useState("");
  const [time2, setTime2] = useState("");

  saveData = async () => {
    if (timeValidation(time1, time2)) {
      var saveTime1 = time1;
      var saveTime2 = time2;
      var hour1 = Number(time1.split(":")[0]);
      var hour2 = Number(time2.split(":")[0]);
      var min1 = Number(time1.split(":")[1]);
      var min2 = Number(time2.split(":")[1]);

      //change to military time
      if (timeDay1 == "PM") {
        if (hour1 != 12) {
          hour1 += 12;
        }
      } else if (hour1 == 12) {
        hour1 = 0;
      }
      if (timeDay2 == "PM") {
        if (hour2 != 12) {
          hour2 += 12;
        }
      } else if (hour2 == 12) {
        hour2 = 0;
      }

      //improved minute display
      saveTime1 = timeDisplayMin(hour1, time1.split(":")[1]);
      saveTime2 = timeDisplayMin(hour2, time2.split(":")[1]);

      if (!isNaN(min1)) {
        hour1 += min1 / 60;
      }
      if (!isNaN(min2)) {
        hour2 += min2 / 60;
      }

      var totalHours = 0;
      if (hour2 > hour1) {
        totalHours = hour2 - hour1;
      } else {
        totalHours = 24 - hour1 + hour2;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "insert into times (time1, time2, hours) values (?, ?, ?)",
          [saveTime1, saveTime2, totalHours]
        );
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dataEnter}>
        <Text style={styles.heading}>Start Time</Text>
        <View style={styles.inputSpace}>
          <TextInput
            placeholder="XX:XX"
            onChangeText={(time) => setTime1(time)}
          />
          <Picker
            selectedValue={timeDay1}
            style={styles.picker}
            onValueChange={(itemValue, itemIndex) => setTimeDay1(itemValue)}
          >
            <Picker.Item label="AM" value="AM" />
            <Picker.Item label="PM" value="PM" />
          </Picker>
        </View>
        <Text style={styles.heading}>End Time</Text>
        <View style={styles.input}>
          <TextInput
            placeholder="XX:XX"
            onChangeText={(time) => setTime2(time)}
            style={styles.textInput}
          />
          <Picker
            selectedValue={timeDay2}
            style={styles.picker}
            onValueChange={(itemValue, itemIndex) => setTimeDay2(itemValue)}
          >
            <Picker.Item label="AM" value="AM" />
            <Picker.Item label="PM" value="PM" />
          </Picker>
        </View>
      </View>
      <Pressable
        onPress={() => {
          saveData();
          navigation.navigate("Home");
        }}
      >
        <Text style={styles.button}>Save</Text>
      </Pressable>
    </View>
  );
}

function DataDisplay() {
  const [forceUpdate, forceUpdateId] = useForceUpdate();
  return (
    <View style={styles.container}>
      <ScrollView style={styles.hoursData}>
        <Times key={`forceupdate-done-${forceUpdateId}`} />
      </ScrollView>
    </View>
  );
}

function ProgressData() {
  const [CompleteDay, setCompleteDay] = useState(0);
  const [CompleteNight, setCompleteNight] = useState(0);
  const [times, setTimes] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "select id, time1, time2, hours from times order by id desc;",
        [],
        (_, { rows: { _array } }) => setTimes(_array)
      );
    });

    if (!(times === null || times.length === 0)) {
      calculateCompleteHours();
    }
  });

  let calculateCompleteHours = () => {
    let dayHours = 0;
    let nightHours = 0;

    for (i = 0; i < times.length; i++) {
      let tempDayHours = 0;
      let tempNightHours = 0;
      var hours = times[i].hours;
      var hour1 =
        Number(times[i].time1.split(":")[0]) +
        Number(times[i].time1.split(":")[1]) / 60;
      var hour2 =
        Number(times[i].time2.split(":")[0]) +
        Number(times[i].time2.split(":")[1]) / 60;
      if (hour1 < hour2) {
        if (hour1 >= 6 && hour1 < 18) {
          if (hour2 >= 6 && hour2 < 18) {
            tempDayHours += hours;
          } else {
            tempDayHours += 18 - hour1;
            tempNightHours += hours - tempDayHours;
          }
        } else {
          if (hour2 >= 6 && hour2 < 18) {
            tempDayHours += hour2 - 6;
            tempNightHours += hours - tempDayHours;
          } else {
            tempNightHours += hours;
          }
        }
      } else { //start time is bigger than end time (day switch)
        if (hour1 >= 6 && hour1 < 18) {
          tempDayHours += 18 - hour1;
          if(hour2 < 6) {
            tempNightHours += 6 + hour2;
          } else{
            tempNightHours += 12;
            tempDayHours += hour2;
          }
        }else{
          if(hour1 < 6){ //starts early morning
            tempNightHours += (6 - hour1) + 6; //time till day is considered + time till midnight
            tempDayHours += 12;
            tempNightHours += hour2;
          }else{ //starts late night
            if(hour2 >= 18){
              tempNightHours += 12 - (hour1 - hour2);
              tempDayHours += 12;
            }else{
              tempNightHours += 24 - hour1;
              if(hour2 < 6){
                tempNightHours += hour2;
              }else{
                tempNightHours += 6;
                tempDayHours += hour2 - 6;
              }
            }
          }
        }
      }
      dayHours += tempDayHours;
      nightHours += tempNightHours;
    }
    setCompleteDay(dayHours);
    setCompleteNight(nightHours);
  };

  let hoursCompleted = 0;
  if (CompleteDay > Day) {
    hoursCompleted = Day;
  } else {
    hoursCompleted = CompleteDay;
  }
  if (CompleteNight > Night) {
    hoursCompleted += Night;
  } else {
    hoursCompleted += CompleteNight;
  }

  return (
    <View style={styles.data}>
      <VictoryPie
        data={[
          { x: "Night", y: Night - CompleteNight },
          { x: "Day", y: Day - CompleteDay },
          { x: "Complete", y: CompleteDay + CompleteNight },
        ]}
        innerRadius={40}
        style={styles.graph}
        colorScale={["#5b2694", "#429ef5", "#29c429"]}
        height={300}
      />
      <Text style={styles.data}>
        Hours completed: {hoursCompleted.toFixed(1)}/{Day + Night}
      </Text>
      <View>
        <Text>Day Hours:</Text>
        <ProgressBar
          style={{ height: 10, width: 200 }}
          progress={CompleteDay / Day}
          color="#49B5F2"
        />
        <View style={styles.inlineData}>
          <Text style={styles.spaceItem}>{CompleteDay.toFixed(1)} Hours</Text>
          <Text>{((CompleteDay / Day) * 100).toFixed(1)}%</Text>
        </View>
      </View>
      <View>
        <Text>Night Hours:</Text>
        <ProgressBar
          style={{ height: 10, width: 200 }}
          progress={CompleteNight / Night}
          color="#49B5F2"
        />
        <View style={styles.inlineData}>
          <Text style={styles.spaceItem}>{CompleteNight.toFixed(1)} Hours</Text>
          <Text>{((CompleteNight / Night) * 100).toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
}

function ProgressDisplay({ navigation }) {
  function link() {
    WebBrowser.openBrowserAsync("https://www.drivinglaws.org/teen/nebteen.php");
  }
  return (
    <View style={styles.container}>
      <ProgressData />
      <Pressable onPress={() => navigation.navigate("Data")}>
        <Text style={styles.button}>Hours Data</Text>
      </Pressable>
      <Pressable onPress={() => link()}>
        <Text>Reference</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  useEffect(() => {
    db.transaction((tx) => {
      // tx.executeSql("drop table times;");
      tx.executeSql(
        "create table if not exists times (id integer primary key not null, time1 string, time2 string, hours int);"
      );
    });
  });
  return (
    <NavigationContainer>
      {
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerStyle: { backgroundColor: "#3d9be3" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="Data"
            component={DataDisplay}
            options={{
              title: "Hours Data",
              headerStyle: { backgroundColor: "#3d9be3" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="Enter"
            component={DataEntry}
            options={{
              headerStyle: { backgroundColor: "#3d9be3" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="Progress"
            component={ProgressDisplay}
            options={{
              headerStyle: { backgroundColor: "#3d9be3" },
              headerTintColor: "#fff",
            }}
          />
        </Stack.Navigator>
      }
    </NavigationContainer>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    height: 120,
    width: 270,
    marginBottom: 80,
  },
  button: {
    fontSize: 20,
    backgroundColor: "#3d9be3",
    padding: 10,
    borderRadius: 15,
    margin: 5,
  },
  input: {
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
    paddingLeft: 35,
  },
  picker: {
    height: 50,
    width: 105,
  },
  heading: {
    fontSize: 20,
  },
  graph: {
    width: 200,
    data: {
      fillOpacity: 0.9,
      stroke: "#fff",
      strokeWidth: 2,
    },
    labels: {
      fill: "#212121",
    },
  },
  data: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  inlineData: {
    flexDirection: "row",
    marginBottom: 20,
  },
  spaceItem: {
    flex: 1,
  },
  headerStyle: {
    backgroundColor: "#3d9be3",
    headerTintColor: "#fff",
    alignItems: "center",
  },
  hoursData: {
    margin: 20,
  },
  hoursItems: {
    margin: 5,
    borderBottomWidth: 1,
    borderColor: "#c2c2c2",
  },
  dataEnter: {
    backgroundColor: "#e8f9fa",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c2c2c2",
    padding: 20,
    margin: 50,
  },
  inputSpace: {
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
    paddingLeft: 35,
    marginBottom: 45,
  },
});
