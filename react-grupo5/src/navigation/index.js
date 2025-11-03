import React from "react"; 
import {createNativeStackNavigator} from "@react-navigation/native-stack" 
import HomeScreen from '../components/Home/HomeScreen'; 
import DetailScreen from "../components/Detail/DetailScreen";

const Stack = createNativeStackNavigator(); 
export default function RootStack(){ 
    return( 
    <Stack.Navigator> 
        <Stack.Screen name="Home" component={HomeScreen} options={{title: 'Clases'}} /> 
        <Stack.Screen name="Detail" component={DetailScreen} options={{title: 'Detalle de clase'}} /> 
    </Stack.Navigator> 
    ); 
}