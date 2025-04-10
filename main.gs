const NoticeUrl = "https://shinomas.blob.core.windows.net/product/html/Infomation/Infomation.csv";
const DiscordWebhookURL = "";
const ScriptProperties = PropertiesService.getScriptProperties();

const DebugMode = false;
const LastPostAtMock = '2025-01-18T17:01:59';
const NowDateMock = '2025-01-24T17:01:00';
const FlyingPostIdsMock = '';

function main() {
  let postAtTmp = '';
  let flyingPostIds = '';
  if (DebugMode) {
    postAtTmp = LastPostAtGetProperties();
    flyingPostIds = FlyingLastPostIDsGetProperties();
    LastPostAtSetProperties(LastPostAtMock);
    FlyingLastPostIDsSetProperties(FlyingPostIdsMock);
  }
  const shinomas = UrlFetchApp.fetch(
    url = NoticeUrl,
    params = {
      "method": "get"
    }
  );
  //console.log(shinomas.toString());
  result = LoadCSV(shinomas.toString());
  sendNotices = ConvertCSV(result);
  sendNotices.forEach((notice) => {
    console.log(notice);
    const payload = {
      content: notice,
    };
    if (!DebugMode) {
      UrlFetchApp.fetch(DiscordWebhookURL, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
      });
      Utilities.sleep(1000);
    }
  })
  if (DebugMode) {
    LastPostAtSetProperties(postAtTmp);
    FlyingLastPostIDsSetProperties(flyingPostIds);
  }
  // DriveApp.createFile(shinomas)
}

function LoadCSV(result){
  if( result.search(/Infomation[\s\S]*?\"\}/g) != -1 )
        result = result.match(/Infomation[\s\S]*?\"\}/g);
  return result;
}
//------------------------------------------------------------------------------------------
function ConvertCSV(str){
    let result = [];
    const sendNotices = []
    const lastPostAt = new Date(LastPostAtGetProperties());

    let mockNowDate = new Date();
    const flyingLastPostIDs = FlyingLastPostIDsGetProperties();
    let setFlyingLastPostIDs = [];
    let iLength = str.length;
     // 各行ごとにカンマで区切った文字列を要素とした二次元配列を生成
    for(let i=0; i < iLength; ++i){
        result[i] = str[i].split(',');
    }

    console.log("NowDate",mockNowDate);

    if (DebugMode) {
      mockNowDate = new Date(NowDateMock)
    }
    
    // 必要数文だけ読み込ませるようにするならxで調整
    let ParseInfo = [];
    const nowDate = new Date(Utilities.formatDate(mockNowDate, "Asia/Tokyo", "yyyy-MM-dd HH:mm:ss"));
    console.log("lastPostAt", lastPostAt);
    for( let x = 0; x < iLength; x++){
        let sendText = "";
        ParseInfo[x] = [];
        for( let y = 0; y < result[x].length; y++ ){
            // 0 はシート名
            if( y != 0 )
            {
              // 要素のみの状態にする
              ParseInfo[x][y] = ParseCSVInfo(result[x][y]);
            }
        }
        // console.log(lastPostAt);
        // 以下はフラゲ防止
        // && (new Date(ParseInfo[x][2]).getTime() < new Date())
        // 28は謎の襲来イベ
        //console.log(lastPostAt.getTime(), new Date(ParseInfo[x][2]).getTime());
        //console.log(lastPostAt.getTime() < new Date(ParseInfo[x][2]).getTime());
        if ((lastPostAt.getTime() < new Date(ParseInfo[x][2]).getTime()) && Number(ParseInfo[x][1]) != 28) {
          // フラゲ情報の場合スキップ
          if (flyingLastPostIDs.split(',').includes(ParseInfo[x][1])) {
            console.log("flying id:", ParseInfo[x][1], ParseInfo[x][9], `https://shinomas.blob.core.windows.net/product/html/Infomation/pages/${ParseInfo[x][10][0]}.html?Back=Top`)
            continue;
          }
          // メンテナンス前日の場合に通知する。
          if (ParseInfo[x][9] === 'メンテナンスのお知らせ' && !isSameDate(new Date(ParseInfo[x][2]), new Date())) {
            continue;
          };
          console.log(lastPostAt, ParseInfo[x][2])
          console.log(ParseInfo[x][2][0], ParseInfo[x][9]);
          sendText =`<@&930778024020946994>
${ParseInfo[x][2][0]}:${ParseInfo[x][9]}
https://shinomas.blob.core.windows.net/product/html/Infomation/pages/${ParseInfo[x][10][0]}.html?Back=Top
`
          // 画像があるか確認
          if (isFoundImageUrl(`https://shinomas.blob.core.windows.net/product/html/Infomation/img/info/event/inf${ParseInfo[x][1]}_1.png`)) {
            sendText += `https://shinomas.blob.core.windows.net/product/html/Infomation/img/info/event/inf${ParseInfo[x][1]}_1.png`
          }
          sendNotices.push(sendText);
          if (nowDate < new Date(ParseInfo[x][2]) && ParseInfo[x][9] !== 'メンテナンスのお知らせ') {
            console.log("nowDate < ParseInfo[x][2]", nowDate, new Date(ParseInfo[x][2]));
            console.log("set flyingLastPostIDs", ParseInfo[x][1]);
            setFlyingLastPostIDs.push(ParseInfo[x][1]);
          }
        }
        // console.log(ParseInfo[x][1], ParseInfo[x][2][0], ParseInfo[x][9], `https://shinomas.blob.core.windows.net/product/html/Infomation/pages/${ParseInfo[x][10][0]}.html`); 
    }
    if (sendNotices.length > 0) {
      console.log("set lastPostDate", nowDate.toString());
      LastPostAtSetProperties(nowDate.toString());
    }
    if (setFlyingLastPostIDs.length !== 0) {
      console.log(setFlyingLastPostIDs.join());
      FlyingLastPostIDsSetProperties(setFlyingLastPostIDs.join());
    }
    return sendNotices;
}
//------------------------------------------------------------------------------------------
//-------------------
//! 取得したcsvの情報内を整理
//-------------------
function ParseCSVInfo(str){
    let ParseText = "";
    // 先頭の[:]を除去
    ParseText = str.replace(/^[\s\S]*?:/,"");
    // 要素の先頭と終端に[/"]があるなら除去
    if( ParseText.search(/[^\x01-\x7E][\s\S]*?(?=\\\")/) != -1  )
    {
        ParseText = ParseText.match(/[^\x01-\x7E][\s\S]*?(?=\\\")/);
        ParseText = ParseText[0].replace(/\r?\n/g, "<br>");
    }
    else if( ParseText.search(/\w.*?(?=\\\")/) != -1 )
        ParseText = ParseText.match(/\w.*?(?=\\\")/);
    return ParseText;
}

// 画像urlが存在するか確認
function isFoundImageUrl(url){
  try {
    UrlFetchApp.fetch(url)
    return true;
  } catch {
    return false;
  }
}

function isSameDate(date1, date2) {
    // 年、月、日をそれぞれ比較
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

function LastPostAtSetProperties(time) {
  ScriptProperties.setProperty('lastPostAt', time);
}

function LastPostAtGetProperties() {
  return ScriptProperties.getProperty('lastPostAt')
}

function FlyingLastPostIDsSetProperties(time) {
  ScriptProperties.setProperty('flyingLastPostIDs', time);
}

function FlyingLastPostIDsGetProperties() {
  return ScriptProperties.getProperty('flyingLastPostIDs')
}
