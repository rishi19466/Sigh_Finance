const Sightroller_ = artifacts.require("Sightroller");          //       constructor() 
const Unitroller_ = artifacts.require("Unitroller");           //     constructor() 

module.exports = function(deployer) {
  deployer.then(async () => {

    // ******** SIGHTROLLER & UNITROLLER CONTRACTS ( THE MAIN LOGIC HANDLING CONTRACTS ON A PLATFORM SPECIFIC LEVEL )  **************
    await deployer.deploy(Sightroller_);          // Deployer address is the Admin

    let Sightroller_____ = await Sightroller_.deployed();                                           
    console.log( 'Sightroller_____ ' +  Sightroller_____.address);

    // await deployer.deploy(Unitroller_);           // Deployer address is the Admin

    // let Unitroller_____ = await Unitroller_.deployed();                                           
    // console.log( 'Unitroller_____ ' +  Unitroller_____.address);

  })

  };


