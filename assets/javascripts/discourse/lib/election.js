//import moment from 'moment';

// ElectionStatuses 객체 정의
const ElectionStatuses = {
	nomination: 1,
	poll: 2,
	closed_poll: 3,
	// finding_winner_poll: 4,
	// closed_finding_winner_poll: 5
};

const ElectionPollAvailableStages = [
	'finding_answer',
	'finding_winner'
];

// 시간 포맷팅 함수 정의
function formatTime(time) {
	return moment(time).format("MMMM Do, h:mm a"); // moment.js를 사용하여 시간 포맷팅
}

// ElectionStatuses와 formatTime을 ES6 모듈로 내보내기
export { ElectionStatuses, ElectionPollAvailableStages, formatTime };
