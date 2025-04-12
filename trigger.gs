// トリガー設定
function setTrigger(){
  delTrigger();
  const time = new Date();
  time.setHours(14);
  time.setMinutes(01);
  ScriptApp.newTrigger('main').timeBased().at(time).create();
  time.setHours(17);
  time.setMinutes(01);
  ScriptApp.newTrigger('main').timeBased().at(time).create();
  time.setHours(0);
  time.setMinutes(01);
  ScriptApp.newTrigger('main').timeBased().at(time).create();
}
//トリガーの削除
function delTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for(const trigger of triggers){
    if(trigger.getHandlerFunction() == "main"){
      ScriptApp.deleteTrigger(trigger);
    }
  } 
}
