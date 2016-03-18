'use strict';

const fs = require("fs-extra");
const path = require("path");
const mcData = require("minecraft-data")("1.8");
const getMinecraftFiles = require("./get_minecraft_files");

if(process.argv.length != 5) {
  console.log("Usage : node image_names.js <version1,version2,...> <output_dir> <temporary_dir>");
  process.exit(1);
}

const minecraftVersions=process.argv[2].split(",");
const outputDir=path.resolve(process.argv[3]);
const temporaryDir=path.resolve(process.argv[4]);

minecraftVersions.forEach(minecraftVersion => {
  extract(minecraftVersion,outputDir+"/"+minecraftVersion,temporaryDir,function(err){
    if(err) {
      console.log(err.stack);
      return;
    }
    console.log("done "+minecraftVersion+"!");
  });
});

// doesn't support 1.7.10 : completely different organization (no block state, no model)
const itemMapping={
  "1.8.8":{
    "wooden_door":"oak_door",
    "fish":"pufferfish",
    "cooked_fish":"cooked_salmon",
    "dye":"dye_black",
    "potion":"bottle_drinkable",
    "skull":"skull_char"
  },
  "1.9":{
    "wooden_door":"oak_door",
    "fish":"pufferfish",
    "cooked_fish":"cooked_salmon",
    "dye":"dye_black",
    "potion":"bottle_drinkable",
    "skull":"skull_char",
    "boat":"oak_boat"
  }
};

//TODO: read the decompiled code (automatically) to generate this
const blockMapping={
  "1.8.8":{
    "log":"oak_log",
    "planks":"oak_planks",
    "sapling":"oak_sapling",
    "leaves":"oak_leaves",
    "tallgrass":"tall_grass",
    "deadbush":"dead_bush",
    "wool":"white_wool",
    "piston_extension":"piston",
    "yellow_flower":"dandelion",
    "red_flower":"poppy",
    "double_stone_slab":"stone_double_slab",
    "stained_glass":"white_stained_glass",
    "double_wooden_slab":"oak_double_slab",
    "wooden_slab":"oak_slab",
    "stained_hardened_clay":"white_stained_hardened_clay",
    "stained_glass_pane":"white_stained_glass_pane",
    "log2":"acacia_log",
    "leaves2":"acacia_leaves",
    "carpet":"white_carpet",
    "double_plant":"sunflower",
    "double_stone_slab2":"red_sandstone_double_slab",
    "stone_slab2":"red_sandstone_slab"
  },
  "1.9":{
    "log":"oak_log",
    "planks":"oak_planks",
    "sapling":"oak_sapling",
    "leaves":"oak_leaves",
    "tallgrass":"tall_grass",
    "deadbush":"dead_bush",
    "wool":"white_wool",
    "piston_extension":"piston",
    "yellow_flower":"dandelion",
    "red_flower":"poppy",
    "double_stone_slab":"stone_double_slab",
    "stained_glass":"white_stained_glass",
    "double_wooden_slab":"oak_double_slab",
    "wooden_slab":"oak_slab",
    "stained_hardened_clay":"white_stained_hardened_clay",
    "stained_glass_pane":"white_stained_glass_pane",
    "log2":"acacia_log",
    "leaves2":"acacia_leaves",
    "carpet":"white_carpet",
    "double_plant":"sunflower",
    "double_stone_slab2":"red_sandstone_double_slab",
    "stone_slab2":"red_sandstone_slab"
  }
};

function extractBlockState(name,path) {
  if(name===null)
    return null;
  else {
    try {
      const t = JSON.parse(fs.readFileSync(path + name + ".json", "utf8"));
      const firstVariant=t["variants"][Object.keys(t["variants"])[0]];
      return firstVariant.model || firstVariant[0].model;
    }
    catch(err) {
      return null;
    }
  }
}

function extractModel(name,path) {
  if(name===null)
    return null;
  else {
    try {
      const t = JSON.parse(fs.readFileSync(path + name + ".json", "utf8"));
      return !t.textures ? null : t.textures[Object.keys(t.textures)[0]];
    }
    catch(err) {
      console.log(name);
    }
  }
}

function getItems(unzippedFilesDir,itemsTexturesPath,itemMapping) {
  const itemTextures = mcData.itemsArray.map(item => {
    const model = itemMapping[item.name] ? itemMapping[item.name] : item.name;
    const texture = extractModel(model, unzippedFilesDir + "/assets/minecraft/models/item/");
    return {
      name: item.name,
      model: model,
      texture: texture
    }
  });
  fs.writeFileSync(itemsTexturesPath, JSON.stringify(itemTextures, null, 2));
}

function getBlocks(unzippedFilesDir,blocksTexturesPath,blockMapping) {
  const blockModel = mcData.blocksArray.map(block => {
    const blockState=blockMapping[block.name] ? blockMapping[block.name] : block.name;
    const model = extractBlockState(blockState, unzippedFilesDir + "/assets/minecraft/blockstates/");
    const texture = extractModel(model, unzippedFilesDir + "/assets/minecraft/models/block/");
    return {
      name: block.name,
      blockState:blockState,
      model: model,
      texture: texture
    }
  });
  fs.writeFileSync(blocksTexturesPath, JSON.stringify(blockModel, null, 2));
}

function copyTextures(unzippedFilesDir,outputDir) {
  fs.copySync(unzippedFilesDir+'/assets/minecraft/textures/blocks', outputDir+"/blocks");
  fs.copySync(unzippedFilesDir+'/assets/minecraft/textures/items', outputDir+"/items");
}


function extract(minecraftVersion,outputDir,temporaryDir,cb) {
  getMinecraftFiles(minecraftVersion,temporaryDir, function (err, unzippedFilesDir) {
    if (err) {
      cb(err);
      return;
    }
    fs.mkdirpSync(outputDir);
    getItems(unzippedFilesDir,outputDir+"/items_textures.json",itemMapping[minecraftVersion]);
    getBlocks(unzippedFilesDir,outputDir+"/blocks_textures.json",blockMapping[minecraftVersion]);
    copyTextures(unzippedFilesDir,outputDir);
    cb();
  });
}