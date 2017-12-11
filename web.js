var express = require ('express');
var bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

var app = express();
var os = require('os');
console.log("** os.type = " + os.type());

app.set('view engine', 'pug');
app.set('views','./views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

var url_lms = "https://www.kau.ac.kr/page/login.jsp?target_page=act_Lms_Check.jsp@chk1-1"
// var url = "http://127.0.0.1:3000/lms_before_arr.html"

var result;
var result_login;
var temp;
var temp_re = new Array();
var temp_result = new Array();
var temp_result_1 = new Array();

function delay(time) {
   return new Promise(function(resolve) {
       setTimeout(resolve, time)
   });
}
app.get("/", function (req, res) {
  console.log("@" + req.method + " " + req.url);
  res.send("Hello World!");
})

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
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']}
    );//{args: ['--no-sandbox', '--disable-setuid-sandbox']}
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

    await page.waitForSelector("#wrapper > header.navbar > nav > div > a.brand");
    if (await page.$('span.postsincelogin') != null) {
      result = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h3, div.overview.forum .name'));
        return anchors.map(anchor => anchor.textContent);
      });
    } else {
      result = "";
    }
    browser.close();

    result = String (result);
    result = result.replace(/:/g,',');

    var k = 0;
    var objJSONAArr = new Array();
    var temp_re = new Array();
    var temp_result = new Array();
    var temp_result_1 = new Array();

    if (result != "") {
      temp_re = result.split(',')
      for(var i = 0; i < temp_re.length; i++) {
        if(temp_re[i] == '포럼') {
          temp_result[k] = temp_re[i-1] + ',' + temp_re[i+1]
          k++
          result = temp_result[k]
        }
      }
      for (var j = 0; j < temp_result.length; j++) {
        var re = temp_result[j]
        result = re.split(',')

        var Subject = result[0]
        var Content = result[1]
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
      for(var i = 0; i < temp_result_1.length; i++) {
        objJSONAArr.push(temp_result_1[i]);
      }

      result = objJSONAArr
    }
    else{
      var jsonArr = new Array();
      result = jsonArr;
    }

    console.log(result);
    res.send(result);
  })();

})

app.listen(8001, function (){
  console.log ('Connected 8001 port!!!');
});
