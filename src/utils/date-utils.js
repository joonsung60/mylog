export const getKSTDateString = (timestamp = null) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  
  return kstDate.toISOString().split('T')[0];
};

export const getKSTTimeString = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    
    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
    });
};