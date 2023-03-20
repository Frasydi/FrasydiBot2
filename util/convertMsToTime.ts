function padTo2Digits(num:number) {
    return num.toString().padStart(2, '0');
  }
export default function convertMsToTime(milliseconds : number) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
  
    seconds = seconds % 60;
    minutes = minutes % 60;
  
   
  
    return `${padTo2Digits(minutes)}:${padTo2Digits(
      seconds,
    )}`;
  }
  
  