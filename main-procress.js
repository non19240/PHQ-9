const io = require('socket.io-client');
const axios = require("axios");

const endPoint = "backend.phq9-thesis.page";
var socket = undefined;
var userIsDisconnected = false;
var article = -1;
var emotion_result_table = {
    1: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    },
    2: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    },
    3: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    },
    4: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    },
    5: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    },
    6: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    },
    7: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    },
    8: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    },
    9: {
        reaction_time: 0.0,
        score: 0.0,
        behaver: {},
        emotion: undefined
    }
}
var display_info = {
    id: "0000",
    is_submit: false,
    user_type: {
        "normal": false,
        "depressed": false,
        "being_treated": false
    },
    result: {},
    submit_count: 0
}

export const videoRecorder = (data) => {
    display_info.id = data.user_id[0];
    socket = io.connect(endPoint);
    if (socket !== undefined) {
        socket.on('connect', function () {
            var userData = {
                user_id: data.user_id[0]
            };
            socket.emit('user_connected', userData);
            console.log("Connected...!", socket.connected)
        });

        socket.on('emotion', async function (emotion) {
            const status = await resolveEmotion(emotion);
            localStorage.setItem('status', status);
            window.dispatchEvent(new Event("storage"));
        });
    }

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    const video = document.querySelector("#videoElement");

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video: true}).then(function (stream) {
            video.srcObject = stream;
        }).catch(function (e) {
            console.log(e)
        });
    }

    const FPS = 7;
    setInterval(() => {
        if (article !== -1) {
            var width = 400;
            var height = 300;
            context.drawImage(video, 0, 0, width, height);
            var imageBase64 = canvas.toDataURL("image/jpeg").split(';base64,')[1];
            context.clearRect(0, 0, width, height);
            var dataToSend = {
                imageBase64: imageBase64,
                timeStamp: Math.floor(new Date().getTime() / 1000),
                user_id: data.user_id[0],
                article: article
            }
            if (userIsDisconnected !== true) {
                socket.emit('image', dataToSend);
            }
        }
    }, 1000 / FPS);
}

export function socketResetData() {
    socket.emit('reset_data');
}

export function socketDisconnect(data) {
    userIsDisconnected = true;
    socket.emit('end_section', data);
}

export function setArticle(number) {
    article = number;
}

export function setSubmitCount() {
    display_info.submit_count += 1;
    setIsSubmitButton()
}

export function stopVideo() {
    var video = document.querySelector("#videoElement");
    var stream = video.srcObject;
    try {
        stream.getTracks().forEach(function (track) {
            track.stop();
        });
    } catch (e) {
        console.log("[INFO] No video stream to stop");
    }
    video.srcObject = null;
}

function resolveEmotion(emotion) {
    return new Promise(resolve => {
        for (const [key, value] of Object.entries(emotion)) {
            emotion_result_table[Number(key)].emotion = value;
        }
        resolve("Success");
    });
}

export async function setEmoteResult(emotion_result) {
    await resolveEmotionResult(emotion_result);
    const score = calculateScore();
    console.log("Score: ", score);
    if (score > 19) {
        display_info.result = {
            color: '#DB5451',
            result: 'ท่านมีอาการซึมเศร้าระดับรุนแรงมาก',
            info: 'ต้องพบแพทย์เพื่อประเมินอาการและให้การรักษาโดยเร็ว ไม่ควรปล่อยทิ้งไว้'
        };
    } else if (score > 14) {
        display_info.result = {
            color: '#E89E60',
            result: 'ท่านมีอาการซึมเศร้าระดับรุนแรงค่อนข้างมาก',
            info: 'ควรพบแพทย์เพื่อประเมินอาการและให้การรักษาระหว่างนี้ควรพักผ่อนให้เพียงพอ นอนหลับให้ได้ 6-8 ชั่วโมง ออกกำลังกายเบาๆ ทำกิจกรรมที่ทำให้ผ่อนคลาย ไม่เก็บตัว และควรขอคำปรึกษาช่วยเหลือจากผู้ใกล้ชิด'
        };
    } else if (score > 8) {
        display_info.result = {
            color: '#FCCD3A',
            result: 'ท่านมีอาการซึมเศร้าระดับปานกลาง',
            info: 'ควรพักผ่อนให้เพียงพอ นอนหลับให้ได้ 6-8 ชั่วโมง ออกกำลังกายสม่ำเสมอ ทำกิจกรรมที่ทำให้ผ่อนคลาย พบปะเพื่อนฝูง ควรขอคำปรึกษาช่วยเหลือจากผู้ที่ไว้วางใจ ไม่จมอยู่กับปัญหา มองหาหนทางคลี่คลาย หากอาการที่ท่านเป็นมีผลกระทบต่อการทำงานหรือการเข้าสังคม (อาการซึมเศร้าทำให้ท่านมีปัญหาในการทำงาน การดูแลสิ่งต่าง ๆ ในบ้าน หรือการเข้ากับผู้คน ในระดับมากถึงมากที่สุด) หรือหากท่านมีอาการระดับนี้มานาน 1-2 สัปดาห์แล้วยังไม่ดีขึ้น ควรพบแพทย์เพื่อรับการช่วยเหลือรักษา'
        };
    } else if (score > 4) {
        display_info.result = {
            color: '#6BAD8F',
            result: 'ท่านมีอาการซึมเศร้าระดับเล็กน้อย',
            info: 'ควรพักผ่อนให้เพียงพอ นอนหลับให้ได้ 6-8 ชั่วโมง ออกกำลังกายสม่ำเสมอ ทำกิจกรรมที่ทำให้ผ่อนคลาย พบปะเพื่อนฝูง ควรทำแบบประเมินอีกครั้งใน 1 สัปดาห์'
        };
    } else {
        display_info.result = {
            color: '#79CFDA',
            result: 'ท่านไม่มีอาการซึมเศร้าหรือมีก็เพียงเล็กน้อย',
            info: 'ไม่จำเป็นต้องรักษา'
        };
    }
}

function calculateScore() {
    var score = 0;
    for (const value of Object.values(emotion_result_table)) {
        if (value.score >= 0) {
            score += Number(value.score);
        }
    }

    return score;
}

function resolveEmotionResult(emotion) {
    return new Promise(resolve => {
        for (const [key, value] of Object.entries(emotion)) {
            emotion_result_table[Number(key)].reaction_time = value.hoverTime;
            emotion_result_table[Number(key)].score = value.checkedValue;
            emotion_result_table[Number(key)].behaver = value.behaver;
        }
        resolve("Success");
    });
}

async function handleOnSendReport(data) {
    return new Promise((resolve, reject) => {
        axios.post("https://backend.phq9-thesis.page/api/save-result", data, {
            headers: {
                "Content-Type": "application/json"
            }
        }).then(function (_) {
            resolve("SaveDBSuccess");
        }).catch(function (_) {
            reject("SaveDBFail");
        });
    });
}

function setIsSubmitButton() {
    if (display_info.is_submit === false) {
        display_info.is_submit = true;
    }
}

export function setUserType(userType) {
    for (const key of Object.keys(display_info.user_type)) {
        display_info.user_type[key] = false;
    }
    display_info.user_type[userType] = true;
}

export async function getReportAndSaveInfo() {
    const dataToSend = {
        display_info: display_info,
        emotion_result_table: emotion_result_table
    };

    return new Promise((resolve) => {
        handleOnSendReport(dataToSend). finally(() => {
            socketResetData();
            resolve(dataToSend);
        });
    });
}

async function getDecisionRequest() {
    const score = calculateScore();
    const userTypeFunc = async () => {
        return await new Promise(resolve => {
            var userType = display_info.user_type
            if (userType["normal"]) {
                resolve("Normal")
            } else if (userType["depressed"]) {
                resolve("Depression")
            } else if (userType["being_treated"]) {
                resolve("treating")
            } else {
                resolve("Normal")
            }
        })
    }
    const behaviorFunc = async () => {
        return await new Promise(resolve => {
            var behavior = {
                Change: "N",
                Skip: "N",
                Overtime: "N",
                Submit: "N"
            }
            for (const value of Object.values(emotion_result_table)) {
                if (value.behaver !== {}) {
                    if (value.behaver.change === true) {
                        behavior.Change = "Y"
                    }
                    if (value.behaver.skip === true) {
                        behavior.Skip = "Y"
                    }
                    if (value.behaver.over === true) {
                        behavior.Overtime = "Y"
                    }
                }
            }
            if (display_info.submit_count > 0) {
                behavior.Submit = "Y"
            }
            resolve(behavior)
        })
    }
    const emotionPercentFunc = async () => {
        return await new Promise(resolve => {
            var emotionPercent = {
                "Worry": 0,
                "Sad": 0,
                "Happy": 0,
                "No Emotion": 0
            }
            for (const value of Object.values(emotion_result_table)) {
                var emotion = value.emotion
                if (emotion !== undefined) {
                    if (emotion["fear"] !== undefined && (emotionPercent["Worry"] < emotion["fear"])) {
                        emotionPercent["Worry"] = emotion["fear"]
                    }
                    if (emotion["sad"] !== undefined && (emotionPercent["Sad"] < emotion["sad"])) {
                        emotionPercent["Sad"] = emotion["sad"]
                    }
                    if (emotion["happy"] !== undefined && (emotionPercent["Happy"] < emotion["happy"])) {
                        emotionPercent["Happy"] = emotion["happy"]
                    }
                    if (emotion["neutral"] !== undefined && (emotionPercent["No Emotion"] < emotion["neutral"])) {
                        emotionPercent["No Emotion"] = emotion["neutral"]
                    }
                }
            }
            resolve(emotionPercent)
        })
    }
    const [userType, behavior, emotionPercent] = await Promise.all([userTypeFunc(), behaviorFunc(), emotionPercentFunc()])
    return {
        "Type": userType,
        "Score": score,
        "Change": behavior.Change,
        "Skip": behavior.Skip,
        "Overtime": behavior.Overtime,
        "Submit": behavior.Submit,
        "Worry": emotionPercent["Worry"],
        "Sad": emotionPercent["Sad"],
        "Happy": emotionPercent["Happy"],
        "No Emotion": emotionPercent["No Emotion"]
    }
}

export async function getDecision() {
    const getDecisionRequestConst = await getDecisionRequest()
    return new Promise((resolve, reject) => {
        axios.post("https://decision.phq9-thesis.page/get-decision", getDecisionRequestConst, {
            headers: {
                "Content-Type": "application/json"
            }
        }).then(function (res) {
            console.log(getDecisionRequestConst)
            console.log(res.data)
            resolve(res.data)
        }).catch(function (_) {
            reject("Error")
        });
    });
}
