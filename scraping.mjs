import { chromium } from "./node_modules/playwright/index.mjs";
import env from "dotenv";
import { News } from "./server/models/model.mjs";
import cron from "node-cron";
env.config();

//ブラウザの立ち上げとページの取得
async function launchBrowserAndGetPage() {
  let browser, page;
  try {
    browser = await chromium.launch({ headless: false, slowMo: 500 });
    page = await browser.newPage();
    await page.goto(process.env.TARGET_URL);
  } catch (error) {
    console.error("Error during launching browser and getting page", error);
  }
  return { browser, page };
}

//日付文字列をISO形式に変換　2024年　4月27日　18時53分　→　2024-04-27T18:53:00
function convertDateString(dateString) {
  const year = new Date().getFullYear();
  const [date, time] = dateString.split(" ");
  const [month, day] = date.split("日")[0].split("月");
  const [hour, minute] = time.split("分")[0].split("時");
  return `${year}-${("0" + month).slice(-2)}-${("0" + day).slice(-2)}T${(
    "00" + hour
  ).slice(-2)}:${("00" + minute).slice(-2)}:00`;
}

//ニュースデータをターゲットページから取得
async function getNewsDataFromTarget(count, page) {
  let newsTitles, dateTimes, hrefValues;
  //ニュースのテキストと属性の取得
  const fetchingTextAndAttribution = async () => {
    newsTitles = await page.locator("dd > a > em").allTextContents();
    dateTimes = await page.locator("dd > a > time").allTextContents();
    hrefValues = await page.$$eval("dd > a", (anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href"))
    );
  };

  try {
    if (count > 0) {
      const getOtherNews =await page.locator(".module--footer.button-more >> .button");
      const buttonCount = await getOtherNews.count();

      if (buttonCount===0) {
        return null;
      } else {
        await Promise.all([
          getOtherNews.click(),
          page.waitForNavigation({ waitUntil: "networkidle" }),
        ]);
      }
    }

    await fetchingTextAndAttribution();
    const convertedDates = dateTimes.map((date) => convertDateString(date));
    return { newsTitles, dateTimes: convertedDates, hrefValues };
  } catch (error) {
    console.error("Error during getting news from target", error);
  }
}

//既に取得済みのデータは除外する
async function excludeSameData(newsTitles, dateTimes, hrefValues) {
  let fetchedData = [];

  try {
    const databaseNews = await News.find();
    newsTitles.forEach((title, i) => {
      if (!databaseNews.find((news) => news.title === title)) {
        fetchedData.push({
          title: title,
          date: dateTimes[i],
          link: hrefValues[i],
        });
      }
    });
  } catch (error) {
    console.error("Error during preventing same data", error);
  }
  console.log(fetchedData);
  return fetchedData;
}

//取得したデータの保存
async function saveToDatabase(fetchedData) {
  try {
    fetchedData.map(async (data) => {
      const newNews = new News(data);
      await newNews.save();
    });
  } catch (error) {
    console.error("Error during saving to database", error);
  }
}

//定義した関数をここで実行し、スクレイピングの全体の制御を行う
async function controller() {
  let browser;
  //関数の実行と分割代入
  try {
    const { browser: launchedBrowser, page } = await launchBrowserAndGetPage();
    browser = launchedBrowser;
    let count = 0;
    let fetchedData;
    do {
      const result = await getNewsDataFromTarget(count, page);
      if (result === null) {
        break;
      }
      const { newsTitles, dateTimes, hrefValues } = result;
      fetchedData = await excludeSameData(newsTitles, dateTimes, hrefValues);
      await saveToDatabase(fetchedData);
      count++;
      //1回目の処理が終わって、取得データが20件なら以降ループ
      //2回目の処理から、上のcountによってgetNewsDataFromTargetの処理内容が変更される
    } while (fetchedData.length === 20);
  } catch (error) {
    console.error("Error During Executing Function", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

controller();
// cron.schedule('*/5 * * * *', controller);
