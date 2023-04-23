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

const key = "@MyApp:key";

const Stack = createNativeStackNavigator();
SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

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
        <Text key={id}>
          Start: {time1}, End: {time2}, Hours: {hours}
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
  const [timeday1, setTimeDay1] = useState("AM");
  const [timeday2, setTimeDay2] = useState("AM");
  const [time1, setTime1] = useState("");
  const [time2, setTime2] = useState("");

  saveData = async () => {
    var hour1 = Number(time1.split(":")[0]);
    if (timeday1 == "PM") {
      hour1 += 12;
    }
    hour1 += Number(time1.split(":")[1]) / 60;

    var hour2 = Number(time2.split(":")[0]);
    if (timeday2 == "PM") {
      hour2 += 12;
    }
    hour2 += Number(time2.split(":")[1]) / 60;

    var totalHours;
    if (hour2 > hour1) {
      totalHours = hour2 - hour1;
    }
    db.transaction((tx) => {
      tx.executeSql(
        "insert into times (time1, time2, hours) values (?, ?, ?)",
        [time1, time2, totalHours]
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Start Time</Text>
      <View style={styles.input}>
        <TextInput
          placeholder="XX:XX"
          onChangeText={(time) => setTime1(time)}
        />
        <Picker
          selectedValue={timeday1}
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
          selectedValue={timeday2}
          style={styles.picker}
          onValueChange={(itemValue, itemIndex) => setTimeDay2(itemValue)}
        >
          <Picker.Item label="AM" value="AM" />
          <Picker.Item label="PM" value="PM" />
        </Picker>
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
      <ScrollView>
        <Times key={`forceupdate-done-${forceUpdateId}`} />
      </ScrollView>
    </View>
  );
}

function ProgressDisplay({ navigation }) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => navigation.navigate("Data")}
        style={styles.button}
      >
        <Text style={styles.button}>Hours Data</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  useEffect(() => {
    db.transaction((tx) => {
      //tx.executeSql("drop table times;");
      tx.executeSql(
        "create table if not exists times (id integer primary key not null, time1 string, time2 string, hours int);"
      );
    });
  });
  return (
    <NavigationContainer>
      {
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Data" component={DataDisplay} />
          <Stack.Screen name="Enter" component={DataEntry} />
          <Stack.Screen name="Progress" component={ProgressDisplay} />
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
    backgroundColor: "#fff",
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
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    paddingLeft: 35,
    marginBottom: 40,
  },
  picker: {
    height: 50, 
    width: 105,
  },
  heading: {
    fontSize: 20,
  }
});
