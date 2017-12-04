/**
 * WebRTC Test Page Script
 * auth : dhshin@m2soft.co.kr
 */
var video_stream; /** MediaStream Object **/ 
var caller_pc; /** Caller PeerConncetion Object **/
var callee_pc; /** Callee PeerConncetion Object **/

var constraints = { /** getUserMedia() Param **/ 
	video : {facingMode : 'environment'},
	audio : {
		optional : [
			{ googEchoCancellation: true },
			{ googAutoGainControl:true },
			{ googNoiseSuppression:true },
			{ googHighpassFilter:true },
			{ googAudioMirroring:false },
			{ sourceId:"default"}
		]
	}
}

var media_constraints = { /** createOffer, createAnswer options **/
	offerToReceiveAudio : true,
	offerToReceiveVideo : true
}

var pc_config = {iceServers : [ /** TURN Server **/
	{
		urls : "turn:magpie.m2soft.co.kr:3478",
		username : "m2soft",
		credential : "onechance"
	}
]};

var roomName = null;

function changeState(state) {
	document.getElementById('state').innerHTML = state;
}

function saveRoomName() {
	roomName = document.getElementById('roomName').value;
}	

function getMedia() {
	console.info('[ getUserMedia ]');
	if(video_stream) {
		return;
	}
	navigator.mediaDevices.getUserMedia(constraints)
		.then(stream => {
			changeState('getUserMedia finished');
			video_stream = stream;
			document.getElementById('video_caller').srcObject = video_stream;
		})
		.catch(e => console.error(e));
}

function stopMedia() {
	console.info('[ stop getUserMedia ]');
	if(video_stream) {
		video_stream.getVideoTracks()[0].stop();
		video_stream.getAudioTracks()[0].stop();
		video_stream.removeTrack(video_stream.getVideoTracks()[0]);
		video_stream.removeTrack(video_stream.getAudioTracks()[0]);
		video_stream = null;
	}

	document.getElementById('video_caller').srcObject = null;
	document.getElementById('video_callee').srcObject = null;

	if(caller_pc) {
		caller_pc.close();
	}
	if(callee_pc) {
		callee_pc.close();
	}
	caller_pc = callee_pc = null;

	changeState('None');
}

function createPeerConnection() {
	if(!video_stream || caller_pc || callee_pc) {
		return;
	}
	console.info('[ create PeerConnection ]');
	caller_pc = null;
	caller_pc = new RTCPeerConnection();
	caller_pc.addStream(video_stream);
	caller_pc.onaddstream = callerOnAddStream;
	caller_pc.onicecandidate = callerOnIceCandidate;

	callee_pc = null;
	callee_pc = new RTCPeerConnection();
	callee_pc.addStream(video_stream);
	callee_pc.onaddstream = calleeOnAddStream;
	callee_pc.onicecandidate = calleeOnIceCandidate;

	changeState('Created RTCPeerConnection');
}

function offer() {
	if(!caller_pc) {
		return;
	}
	console.info('[ createOffer ]');
	caller_pc.createOffer(media_constraints)
		.then(caller_sdp => {
			caller_pc.setLocalDescription(caller_sdp);
			console.log('Finished createOffer');
			changeState('Finished createOffer');
			console.log(caller_pc);
		})
		.catch(e => console.error(e));
}

function answer() {
	if(!caller_pc || !callee_pc) {
		return;
	}
	console.info('[ createAnswer ]');
	callee_pc.setRemoteDescription(caller_pc.localDescription)
		.then(() => {
			return callee_pc.createAnswer(media_constraints);
		})
		.then(callee_sdp => {
			callee_pc.setLocalDescription(callee_sdp);
			caller_pc.setRemoteDescription(callee_sdp);
			changeState('Finished createAnswer');
			console.log(callee_pc);
		})
		.catch(e => console.error(e));
}

function callerOnIceCandidate(event) {
	console.log('iceGatheringState  : ' + caller_pc.iceGatheringState);
	console.log('iceConnectionState : ' + caller_pc.iceConnectionState);
	console.log('ice Candidates     : ', event.candidate);
}

function callerOnAddStream(event) {
	console.info('[ Caller onaddstream() ]');
//	console.log(event);
	document.getElementById('video_callee').srcObject = event.stream;
	changeState('Connected');
}

function calleeOnIceCandidate(event) {
//	console.info('[ Callee onicecandidate() ');
//	console.log(event);
}

function calleeOnAddStream(event) {
	console.info('[ Callee onaddstream() ]');
//	console.log(event);
}

