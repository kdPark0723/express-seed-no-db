require('dotenv').config();
const convertCamelToSnake = require('../../../util/convertCamelToSnake');
const Logger = require('../../logger');

const VALUE_NAME = 'valueName';

function getEnvironmentValue(configName, names) {
  let namePath = names[0];

  for (let i = 1; i < names.length; i++) {
    namePath += `_${names[i]}`;
  }

  return process.env[`${namePath}_${configName}`] || process.env[`${namePath}`];
}

function concatElementUserEnvironmentValue(configName, path, current) {
  let valueName = '';
  let currentPath = [...path];
  for (const property in current) {
    if (property === VALUE_NAME) {
      currentPath[currentPath.length - 1] = convertCamelToSnake(current[property])

      continue;
    }

    const propertyName = convertCamelToSnake(property);

    if (current[property] && typeof current[property] === 'object') {
      valueName = convertCamelToSnake(property);

      concatElementUserEnvironmentValue(configName, currentPath.concat([valueName]), current[property]);
      continue;
    }

    const environmentValue = getEnvironmentValue(
      convertCamelToSnake(configName), currentPath.concat([propertyName]),
    );
    current[property] = environmentValue || current[property];
  }
}

function concatUserEnvironmentValue(config, configName) {
  concatElementUserEnvironmentValue(configName, [], config);

  config.env = configName;
}

function assignConfig(commonConfig, config) {
  const newConfig = commonConfig;

  for (const property in config) {
    if (newConfig[property] && typeof config[property] === 'object' && newConfig[property]) {
      newConfig[property] = assignConfig(newConfig[property], config[property]);
    } else {
      newConfig[property] = config[property];
    }
  }

  return newConfig;
}

function createLogger(config) {
  const logger = new Logger(config.logger);

  config.logger = logger;
}

const env = process.env.NODE_ENV || 'development';

const commonConfig = require('./common');
const currentConfig = require(`./${env}`);

const config = assignConfig(commonConfig, currentConfig);

concatUserEnvironmentValue(config, `${env}`);

createLogger(config);

module.exports = config;
