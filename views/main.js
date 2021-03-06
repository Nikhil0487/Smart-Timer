// Credit: Mateusz Rybczonec
const FULL_DASH_ARRAY = 283;
var WARNING_THRESHOLD = 10;
var ALERT_THRESHOLD = 5;
const COLOR_CODES = {
    info: {
        color: "green"
    },
    warning: {
        color: "orange",
        threshold: WARNING_THRESHOLD
    },
    alert: {
        color: "red",
        threshold: ALERT_THRESHOLD
    }
};
var TIME_LIMIT = 1200;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
var timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;
var userId
var w;
setRemainingPathColor(11)
document.getElementById("base-timer-label").innerHTML = formatTime(
    timeLeft
);
document.getElementById("button2").disabled = true;

function onTimesUp() {
    clearInterval(timerInterval);
    setRemainingPathColor(11)
    $('#qualityModal').modal('show');
    document.getElementById("button1").disabled = false;
    document.getElementById("button2").disabled = true;
}

function startTimer() {
    document.getElementById("button1").disabled = true;
    document.getElementById("button2").disabled = false;
    let givenTime = document.getElementById("inputPassword3").value
    if (givenTime != 0) {
        TIME_LIMIT = givenTime * 60
    }
    WARNING_THRESHOLD = givenTime * 0.25;
    ALERT_THRESHOLD = givenTime * 0.10;
    if (typeof(Worker) !== "undefined") {
        w = new Worker("worker.js");
        w.onmessage = function(event) {
            timePassed = timePassed += 1;
            timeLeft = TIME_LIMIT - timePassed;
            document.getElementById("base-timer-label").innerHTML = formatTime(
                timeLeft
            );
            setCircleDasharray();
            setRemainingPathColor(timeLeft);
            console.log("Time left:" + timeLeft);
            if (timeLeft === 0) {
                notifyTimersUp()
                w.terminate();
                onTimesUp();
            }
        };
    }
}

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    let seconds = time % 60;
    if (seconds < 10) {
        seconds = `0${seconds}`;
    }
    return `${minutes}:${seconds}`;
}

function setRemainingPathColor(timeLeft) {
    const { alert, warning, info } = COLOR_CODES;
    if (timeLeft <= alert.threshold) {
        document
            .getElementById("base-timer-path-remaining")
            .classList.remove(warning.color);
        document
            .getElementById("base-timer-path-remaining")
            .classList.add(alert.color);
    } else if (timeLeft <= warning.threshold) {
        document
            .getElementById("base-timer-path-remaining")
            .classList.remove(info.color);
        document
            .getElementById("base-timer-path-remaining")
            .classList.add(warning.color);
    } else {
        document
            .getElementById("base-timer-path-remaining")
            .classList.remove(alert.color);
        document.getElementById("base-timer-path-remaining")
            .classList.add(info.color);
    }
}

function calculateTimeFraction() {
    const rawTimeFraction = timeLeft / TIME_LIMIT;
    return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
}

function setCircleDasharray() {
    const circleDasharray = `${(
    calculateTimeFraction() * FULL_DASH_ARRAY
  ).toFixed(0)} 283`;
    document
        .getElementById("base-timer-path-remaining")
        .setAttribute("stroke-dasharray", circleDasharray);
}

function stopTimer() {
    w.terminate();
    if (document.querySelector('#button2').textContent == 'Reset') {
        document.querySelector('#button1').textContent = 'Start';
        document.querySelector('#button2').textContent = 'Stop';
        document.getElementById("button1").disabled = false;
        document.getElementById("button2").disabled = true;
        $('#qualityModal').modal('show');
        TIME_LIMIT = 1200
        document.getElementById("base-timer-label").innerHTML = formatTime(
            TIME_LIMIT
        );
        return;
    }
    clearInterval(timerInterval)
    document.getElementById("button1").disabled = false;
    document.querySelector('#button1').textContent = 'Resume';
    document.querySelector('#button2').textContent = 'Reset';
}

function sendFeedback() {
    let timeConsumed = TIME_LIMIT - timeLeft
    let quality = $("#taskQuality").val();
    let type = $("#taskName").val();
    let description = $("#taskDetails").val();
    let feedback = {
        user: userId,
        time: timeConsumed,
        quality: quality,
        type: type,
        details: description
    };
    console.log("JSON to send" + JSON.stringify(feedback))
    $.ajax({
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        url: '../api/timer', //Ensure that 'to_do_list_function' is the package name of your function
        data: JSON.stringify(feedback),
        success: function(data) {
            document.getElementById("button1").disabled = false;
            document.getElementById("button2").disabled = true;
            timePassed = 0;
        }
    });

}

function onSignIn(googleUser) {
    // Useful data for your client-side scripts:
    var profile = googleUser.getBasicProfile();
    console.log("ID: " + profile.getId()); // Don't send this directly to your server!
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log('Family Name: ' + profile.getFamilyName());
    console.log("Image URL: " + profile.getImageUrl());
    console.log("Email: " + profile.getEmail());

    // The ID token you need to pass to your backend:
    var id_token = googleUser.getAuthResponse().id_token;
    console.log("ID Token: " + id_token);
    userId = profile.getId()
}

function notifyTimersUp() {
    console.log("notify")
    if (Notification.permission === "granted") {
        console.log("notify granted")
        var notification = new Notification("Time's up!");
    } else if (Notification.permission !== "denied") {
        console.log("notify denied")
        Notification.requestPermission().then(function(permission) {
            if (permission === "granted") {
                console.log("notify granted now")
                var notification = new Notification("Time's up!");
            }
        });
    }
}