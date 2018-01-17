var express = require ('express');
var bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

var app = express();

app.set('view engine', 'pug');
app.set('views','./views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

var url_lms = "https://www.kau.ac.kr/page/login.jsp?target_page=act_Lms_Check.jsp@chk1-1"
// var url = "http://127.0.0.1:3000/lms_before_arr.html"

var total_result;
var result = 1;
var result_1;
var result_forum;
var result_assign_name;
var result_assign_info;
var result_login;
var temp;
var temp_re = new Array();
var temp_result = new Array();
var temp_result_1 = new Array();
var temp_result_2 = new Array();

function delay(time) {
   return new Promise(function(resolve) {
       setTimeout(resolve, time)
   });
}

app.get("/test_post", function(req, res){
  console.log("@" + req.method + " " + req.url);
  res.render('test_post')
})

app.post("/login", function(req,res){
  console.log("@" + req.method + " " + req.url);

  var result_login = ""
  var id_req = req.body.studentNum;
  var pwd_req = req.body.password;

  (async () => {
    const browser = await puppeteer.launch({headless : false,args: ['--no-sandbox', '--disable-setuid-sandbox']});
    browser.newPage({ context: 'another-context' })
    const page = await browser.newPage();
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
    await page.goto(url_lms); // lms 로그인창으로 이동
    // await page.goto('http://127.0.0.1:3000/lms_before_arr.html') // 테스트용
    await page.type("[name=p_id]", id_req) // id찾아서 넣기
    await page.type("[name=p_pwd]", pwd_req) // 비밀번호 찾아서 넣기
    await page.click("body > div.aside > div.articel > table:nth-child(2) > tbody > tr:nth-child(3) > td > form > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(2) > a > img") // 로그인 버튼 클릭
    await delay(5000);
    if (await page.$('#loggedin-user > ul > li > div') != null) {
      result_login = "1";
    } else {
      result_login = "0";
    }

    browser.close();
    console.log(result_login);
    res.send(result_login);
  })();
})


app.post("/lms/data", function(req,res){
  console.log("@" + req.method + " " + req.url);

  var id_req = req.body.studentNum;
  var pwd_req = req.body.password;

  (async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    browser.newPage({ context: 'another-context' })
    const page = await browser.newPage();
    await page.goto(url_lms); // lms 로그인창으로 이동
    // await page.goto('http://127.0.0.1:3000/lms_before_arr.html') // 테스트용
    await page.type("[name=p_id]", id_req) // id찾아서 넣기
    await page.type("[name=p_pwd]", pwd_req) // 비밀번호 찾아서 넣기
    await page.click("body > div.aside > div.articel > table:nth-child(2) > tbody > tr:nth-child(3) > td > form > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(2) > a > img") // 로그인 버튼 클릭

    필요한 정보 받아오기
    await page.waitForSelector("#wrapper > header.navbar > nav > div > a.brand");
    if (await page.$('span.postsincelogin') != null) {
      //[포럼]정보 받아오기
      result_forum = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h3, div.overview.forum .name'));
        return anchors.map(anchor => anchor.textContent);
      });
      //[과제]정보 받아오기
      result_assign_name = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h3, div.assign.overview .name'));
        return anchors.map(anchors => anchors.textContent);
      });
      //[과제]마감시간 받아오기
      result_assign_info = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h3, div.assign.overview .info'));
        return anchors.map(anchors => anchors.textContent);
      });

    } else {
      //[과제]정보 받아오기
      result_assign_name = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h3, div.assign.overview .name'));
        return anchors.map(anchors => anchors.textContent);
      });
      //[과제]마감시간 받아오기
      result_assign_info = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h3, div.assign.overview .info'));
        return anchors.map(anchors => anchors.textContent);
      });
    }

    browser.close();

    //웹에서 얻어온 정보에서 특수문자 제거
    result_forum = String (result_forum);
    result_forum = result_forum.replace(/:/g,',');
    result_assign_name = String (result_assign_name);
    result_assign_name = result_assign_name.replace(/:/g,',');
    result_assign_info = String (result_assign_info);
    result_assign_info = result_assign_info.replace(/:/g,',');

    //필요한 데이터만 뽑아내는 과정
    var objJSONAArr = new Array();
    var objJSONAArr_1 = new Array();

    var temp_re_forum = new Array();
    var temp_re_assign_name = new Array();
    var temp_re_assign_info = new Array();

    var temp_forum = new Array();
    var temp_assign_name = new Array();
    var temp_assign_info = new Array();

    var TTime = new Array();

    //정보 3개 중 한개만 있어도
    if (result != "") {

      //필요한 변수
      var k = 0;
      var m = 0;
      var l = 0;

      //,를 기준으로 자르기
      temp_forum = result_forum.split(',');
      temp_assign_name = result_assign_name.split(',');
      temp_assign_info = result_assign_info.split(',');

      //포럼 정보 찾아내기
      for(var i = 0; i < temp_forum.length; i++) {
        if(temp_forum[i] == '포럼') {
          if(temp_forum[i-1].indexOf(')') != -1){
            temp_re_forum[k] = temp_forum[i-1] + ',' + temp_forum[i+1];
            k++;
            result_forum = temp_re_forum[k];
          }
          else{
            for(var p = i; p >=0; p--){
              if(temp_forum[p].indexOf(')') != -1){
                temp_re_forum[k] = temp_forum[p] + ',' + temp_forum[i+1];
                k++;
                result_forum = temp_re_forum[k];
                break;
              }
            }
          }
        }
      }

      k=0;

      //과제정보 찾아내기
      for(var i = 0; i < temp_assign_name.length; i++){
        if(temp_assign_name[i] == '과제'){
          if(temp_assign_name[i-1].indexOf(')') != -1){
            temp_re_assign_name[k] = temp_assign_name[i-1] + ',' + temp_assign_name[i+1];
            k++;
            result_assign_name = temp_re_assign_name[k];
          }
          else{
            for(var p = i; p >= 0; p--){
              if(temp_assign_name[p].indexOf(')') != -1){
                temp_re_assign_name[k] = temp_assign_name[p] + ',' + temp_assign_name[i+1];
                k++;
                result_assign_name = temp_re_assign_name[k];
                break;
              }
            }
          }
        }
      }

      k=0;

      //포럼의 시간
      for (var j = 0; j < temp_re_forum.length; j++) {
        var re = temp_re_forum[j]
        result = re.split(',');

        var Subject = result[0]
        var Content = result[1]
        Content = "[포럼]" + Content;
        var date = new Date();
        var hour = date.getHours();
        var hour_str;
        if (hour > 12) {
          hour = hour - 12;
          hour_str = "오후 " + String (hour)
        } else {
          hour_str = "오전 " + String (hour)
        }
        var Time = String(date.getMonth()+1) + '월 ' + String(date.getDate()) + '일 ' + hour_str + ' : ' + String(date.getMinutes()) + '분'

        temp_result_1[j] = {"time" : Time , "subject" : Subject , "content" : Content}
      }

      //제이슨으로 바꾸기
      for(var i = 0; i < temp_result_1.length; i++) {
        objJSONAArr.push(temp_result_1[i]);
      }

      //마지막으로 제이슨으로 바꾼 결과넣기
      result = objJSONAArr

      //과제의 마감시간 만들기
      for(var i = 0; i < temp_assign_info.length; i++){
        if(temp_assign_info[i] == '마감 일시'){
          TTime[l] = temp_assign_info[i+1] + temp_assign_info[i+2] + ' : ' + temp_assign_info[i+3];
          l++;
        }
      }

      //마감시간 넣기
      for(var j = 0; j < temp_re_assign_name.length; j++){
        var re = temp_re_assign_name[j];
        result_1 = re.split(',');

        var Subject = result_1[0];
        var Content = result_1[1];
        var Time = TTime[j];
        Content = "[과제]" + Content;

        temp_result_2[j] = {"time" : Time , "subject" : Subject , "content" : Content};
      }

      //제이슨으로 바꾸기
      for(var i = 0; i < temp_result_2.length; i++){
        objJSONAArr.push(temp_result_2[i]);
      }

      //마지막으로 제이슨으로 바꾼 결과 넣기
      result_1 = objJSONAArr;
    }

    //정보 3개 모두 없다면
    else{
      var jsonArr = new Array();
      result_1 = jsonArr;
    }

    //화면과 콘솔에 결과띄우기
    console.log(result_1);
    res.send(result_1);
  })();

});

app.listen(8001, function (){
  console.log ('Connected 8001 port!!!');
});
