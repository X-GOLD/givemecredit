$( document ).ready(function() 
{   
var str = $("body").text(); 
var regExp = /\(([^)]+)\)\(([^)]+)\)/;
var btn = str.match(regExp);
var profileLink = btn[1];
var address = btn[2];    
        
$('a:contains("' + profileLink + '")').html("View Profile").addClass("profile").attr("href", profileLink).next().html("<span id='"+address+"' >Give Me Credit</span>").addClass("gmc");  
      
var inactive, likes, dislikes, url, address, score, total;  
        
$.ajaxSetup({ dataType: "jsonp" });    
    
$.getJSON("https://spreadsheets.google.com/feeds/list/1j6owrU2W_FIfINm-dr_JFcM8WI8cBaU6mX7hAalzttA/1/public/full?alt=json", function(data) 
{
  var rowNum = data.feed.entry.length - 1;    
  inactive = data.feed.entry[rowNum].gsx$inactive.$t;  
  $('.inactiveCredits span').text(inactive);     
});  
   
$.getJSON("https://spreadsheets.google.com/feeds/list/1eIy0TFfGX2ibl6NVnEKqUI_HHsg4828FivtN3ICQom8/1/public/full?alt=json", function(data) 
{
    var rowNum = data.feed.entry.length - 1;
    likes = data.feed.entry[rowNum].gsx$likes.$t;
    dislikes = data.feed.entry[rowNum].gsx$dislikes.$t;
    $('.numLikes').text(likes);
    $('.numDislikes').text(dislikes); 
    total = parseInt(likes) + parseInt(dislikes);
    score = Math.round(likes / total);
    $('.score span').text(total);
});  
    
    $('.thumbsup').click(function() 
    {
 
        likes = parseInt(likes) + 1;
        $('.numLikes').text(likes);
        inactive = parseInt(inactive) + 1;
        $('.inactiveCredits span').text(inactive);
    total = parseInt(likes) + parseInt(dislikes);
    score = Math.round(likes / total);
    $('.score span').text(total);
             
        $.ajax(
        {
            url: "https://docs.google.com/a/iglu.in.th/forms/d/1RlqS6rhpBtFLI3VFgX9RW-UNJekYV1kuTKitdEnqvGc/formResponse?embedded=true",
                data: { "entry.92609594":likes, 
                        "entry.137689548":dislikes, 
                        "entry.224546610":"someurl.com", 
                        "entry.1895262749":"12H9wz4QZ2HZHc4gKv7f7MgCtvDFWFc7RF"
                      },
                        type: "POST",
                        dataType: "jsonp"
                    
        });
        
        $.ajax(
        {
            url: "https://docs.google.com/a/iglu.in.th/forms/d/1_WWSoIeO8bupxmW6MOz-kn-ZSHDPVDcaTXfp1dhvSeY/formResponse?embedded=true",
                data: { "entry.119733302":inactive
                      },
                        type: "POST",
                        dataType: "jsonp"
                    
        });
        
    });
    
    $('.thumbsdown').click(function() 
    {
                dislikes = parseInt(dislikes) + 1;
                $('.numDislikes').text(dislikes);
                inactive = parseInt(inactive) + 1;
                $('.inactiveCredits span').text(inactive);
          
        $.ajax(
        {
            url: "https://docs.google.com/a/iglu.in.th/forms/d/1RlqS6rhpBtFLI3VFgX9RW-UNJekYV1kuTKitdEnqvGc/formResponse?embedded=true",
                data: { "entry.92609594":likes, 
                        "entry.137689548":dislikes, 
                        "entry.224546610":"someurl.com", 
                        "entry.1895262749":"12H9wz4QZ2HZHc4gKv7f7MgCtvDFWFc7RF"
                      },
                        type: "POST",
                        dataType: "jsonp"
                    
        });
        
        $.ajax(
        {
            url: "https://docs.google.com/a/iglu.in.th/forms/d/1_WWSoIeO8bupxmW6MOz-kn-ZSHDPVDcaTXfp1dhvSeY/formResponse?embedded=true",
                data: { "entry.119733302":inactive
                      },
                        type: "POST",
                        dataType: "jsonp"
                    
        });
    });  
    
$('.gmc').click(function() 
{ 
    inactive = inactive - 1;
    $('.inactiveCredits span').text(inactive); //will need to write this to db also
    
        $.ajax(
        {
            url: "https://docs.google.com/a/iglu.in.th/forms/d/1_WWSoIeO8bupxmW6MOz-kn-ZSHDPVDcaTXfp1dhvSeY/formResponse?embedded=true",
                data: { "entry.119733302":inactive
                      },
                        type: "POST",
                        dataType: "jsonp"
                    
        });
});
    

    
    
});
