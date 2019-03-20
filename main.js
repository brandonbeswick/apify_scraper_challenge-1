const Apify = require('apify');
const util = require('util');


Apify.main(async () => {

    // Get queue and enqueue first url.
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest(new Apify.Request({ url: 'https://www.visithoustontexas.com/event/zumba-in-the-plaza/59011/' }));

    // Create crawler.
    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,

        // This page is executed for each request.
        // If request failes then it's retried 3 times.
        // Parameter page is Puppeteers page object with loaded page.
        handlePageFunction: getEventData,

        // If request failed 4 times then this function is executed.
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed 4 times`);
        },
    });

    // Run crawler.
    await crawler.run();
    
});


//function called in handlePageFunction option
const getEventData = async ({ page, request }) => {
        
    // Function to get data from page
    const title = await page.title(); 
    
    // calls function to crawl page
    const pageFunction = ($scanPage) => {
                const data = [];
                
                // We're getting the basic info on visit 
                //houston Zumba in the Plaza page
                //using a for each and arrow function
        
                $scanPage.forEach(($infoBlock) => {
                    
                   //push the data into data array
                    data.push({ 
                        url: '',
                        description: $infoBlock.querySelector('.description').innerText,
                        date: $infoBlock.querySelector('.dates').innerText,
                        //using css child selectors to find specific divs
                        time: $infoBlock.querySelector('div:nth-child(8)').innerText,
                        recurring: $infoBlock.querySelector('.dates:nth-of-type(2)').innerText,
                        place:{
                            //taking this in bulk to clean up later
                            street: $infoBlock.querySelector('.adrs').innerText,
                            city: null,
                            state: null,
                            postal: null,
                        },
                        details:{
                            contact: $infoBlock.querySelector('.detail-c2 div:nth-child(6)').innerText,
                            phone: $infoBlock.querySelector('div:nth-child(7)').innerText,
                            admission: $infoBlock.querySelector('div:nth-child(9)').innerText,
                        },
                        timestamp: '',
                    });
                });

                return data;
            };
        // set the data var with a call back pageFunction
        //and class name from page to crawl
        const data = await page.$$eval('.contentWrapper', pageFunction);  



    // Log data (util is a tool that nicely formats objects in the console)
    console.log(util.inspect(title, false, null));
    
    //create event object
    
    let event ={
            url: null,
            description: null,
            date: null,
            time: null,
            recurring: null,
            place:{
                street: null,
                city: null,
                state: null,
                postal: null,
            },
            details:{
                contact: null,
                phone: null,
                admission: null,
            },
            timestamp: null,
    };
            data.forEach((tops) => {
                
                var currentTime= new Date();
                var dateRaw = tops.place.street;
                //taking the raw Text and spliting
                //address, city, state, zip
                //example - 2711 PLAZA DRIVE | SUGAR LAND, TX 77479
                
                //take everything before the | 
                var justFront = dateRaw.split(" | ");
                
                //take the last 5 char -amount in zip-
                var zipCode = dateRaw.slice(-5);
                
                //split the second from the Just front at ", "
                var city = justFront[1].split(", ");
                
                //split the srcond from the city a the " "
                var state = city[1].split(" ");
                
                //pull the data from data var
                var contactInfoRaw = tops.details.contact;
                
                //clean up the -example:- from the data
                var contactInfo = contactInfoRaw.split(": ");
                var phoneInfoRaw = tops.details.phone;
                var phoneInfo = phoneInfoRaw.split(": ");
                var admissionInfoRaw = tops.details.admission;
                var admissionInfo = admissionInfoRaw.split(": ");
                
                //add to the event object
                event.url = page.url();
                event.description = tops.description;
                event.date = tops.date;
                event.time = tops.time;
                event.recurring = tops.recurring;
                event.place.street = justFront[0];
                event.place.city = city[0];
                event.place.state = state[0];
                event.place.postal = zipCode;
                event.details.contact = contactInfo[1];
                event.details.phone = phoneInfo[1];
                event.details.admission = admissionInfo[1];
                event.timestamp = currentTime.toUTCString();
            });

console.log(event);

    
}


