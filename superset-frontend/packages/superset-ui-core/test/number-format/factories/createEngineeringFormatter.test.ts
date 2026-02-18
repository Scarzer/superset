/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { NumberFormatter, createEngineeringFormatter } from '@superset-ui/core';

test('creates an instance of EngineeringFormatter', () => {
  const formatter = createEngineeringFormatter({ unit: 'W' });
  expect(formatter).toBeInstanceOf(NumberFormatter);
});

test('formats amps in human readable format with default options', () => {
  const formatter = createEngineeringFormatter({ unit: 'A' });

  expect(formatter(0)).toBe('0A');
  expect(formatter(0.5)).toBe('500mA');
  expect(formatter(0.0004)).toBe('0A');
  expect(formatter(1)).toBe('1A');
  expect(formatter(999)).toBe('999A');
  expect(formatter(1000)).toBe('1kA');
  expect(formatter(1500)).toBe('1.5kA');
  expect(formatter(-1500)).toBe('-1.5kA');
});

test('formats volts in human readable format with default options', () => {
  const formatter = createEngineeringFormatter({ unit: 'V' });

  expect(formatter(12)).toBe('12V');
  expect(formatter(0.012)).toBe('12mV');
  expect(formatter(12000)).toBe('12kV');
});

test('formats watts in human readable format with default options', () => {
  const formatter = createEngineeringFormatter({ unit: 'W' });

  expect(formatter(2500)).toBe('2.5kW');
  expect(formatter(1000000)).toBe('1MW');
});

test('formats watt-hours in human readable format with default options', () => {
  const formatter = createEngineeringFormatter({ unit: 'Wh' });

  expect(formatter(0.2)).toBe('200mWh');
  expect(formatter(1200)).toBe('1.2kWh');
  expect(formatter(1000000)).toBe('1MWh');
});

test('formats amp-hours in human readable format with default options', () => {
  const formatter = createEngineeringFormatter({ unit: 'Ah' });

  expect(formatter(0.25)).toBe('250mAh');
  expect(formatter(2.5)).toBe('2.5Ah');
  expect(formatter(2500)).toBe('2.5kAh');
});

test('formats joules in human readable format with default options', () => {
  const formatter = createEngineeringFormatter({ unit: 'J' });

  expect(formatter(800)).toBe('800J');
  expect(formatter(1200)).toBe('1.2kJ');
});

test('formats coulombs in human readable format with default options', () => {
  const formatter = createEngineeringFormatter({ unit: 'C' });

  expect(formatter(0.75)).toBe('750mC');
  expect(formatter(1500)).toBe('1.5kC');
});

test('formats with additional decimals option', () => {
  const formatter0decimals = createEngineeringFormatter({
    unit: 'W',
    decimals: 0,
  });
  expect(formatter0decimals(1500)).toBe('2kW');

  const formatter3decimals = createEngineeringFormatter({
    unit: 'W',
    decimals: 3,
  });
  expect(formatter3decimals(1500)).toBe('1.5kW');
});
