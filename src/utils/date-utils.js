// KST (UTC+9) 기준의 YYYY-MM-DD 문자열을 반환하는 함수
export const getKSTDateString = (timestamp = null) => {
  // 1. 대상 날짜 객체 생성 (없으면 현재 시간)
  const date = timestamp ? new Date(timestamp) : new Date();
  
  // 2. UTC 시간에 9시간(ms 단위)을 더해서 '강제로' KST 시간대로 이동시킨 Date 객체를 만듦
  // (참고: 이 객체의 실제 시간은 왜곡되지만, ISO 문자열을 뽑을 때는 한국 날짜가 나옴)
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  
  // 3. ISOString으로 변환하면 UTC 기준으로 나오는데, 위에서 9시간 밀어버렸으므로
  // 결과적으로 한국 시간의 날짜가 찍힘.
  return kstDate.toISOString().split('T')[0];
};

// 댓글용 시간 포맷 (MM.DD HH:mm) - 이것도 KST 기준
export const getKSTTimeString = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    
    // toLocaleString은 브라우저의 로컬 타임존을 따르므로, 
    // 한국 사용자의 브라우저에서는 자동으로 한국 시간이 나옵니다.
    // 하지만 명시적으로 'Asia/Seoul'을 박아두면 더 안전합니다.
    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
    });
};