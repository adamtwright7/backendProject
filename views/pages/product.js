const searchArmor = async () =>{
    const mainHome = document.querySelector(".mainHome");
    topGameContainer.innerHTML = "";
    console.log(inputField)
    const gameURL = `https://www.dnd5eapi.co/api/equipment-categories/armor`
    
    const rawData = await fetch(gameURL);
    const json = await rawData.json();
    console.log(json)

const itemCard = document.createElement("div")

const itemName = document.createElement("h1")

const itemPicture = document.createElement("img")



}