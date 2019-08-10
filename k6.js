import http from "k6/http";
// import { check,sleep } from "k6";

export default function() {
    let restaurant = Math.ceil(Math.random()*10000000);
    http.get(`http://localhost:5001/${restaurant}`);
};

