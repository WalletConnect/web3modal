import {
  CloudWatch,
  type MetricDatum,
  type PutMetricDataCommandInput
} from '@aws-sdk/client-cloudwatch'
import type { TestInfo } from '@playwright/test'

import { BASE_URL } from '@reown/appkit-testing'

import { timeEnd, timeStart } from '../../shared/utils/logs'
import type { TimingRecords } from '../fixtures/timing-fixture'

export const CANARY_TAG = '@canary'
export const CANARY_METRIC_NAME_ANNOTATION = 'canary-metric-name'

export function getCanaryAnnotation(metricName: string) {
  return { type: CANARY_METRIC_NAME_ANNOTATION, description: metricName }
}

export function getCanaryTagAndAnnotation(metricName: string) {
  return { tag: CANARY_TAG, annotation: getCanaryAnnotation(metricName) }
}

export async function afterEachCanary(testInfo: TestInfo, timingRecords: TimingRecords) {
  if (testInfo.tags.includes(CANARY_TAG)) {
    const annotation = testInfo.annotations.find(a => a.type === CANARY_METRIC_NAME_ANNOTATION)
    if (!annotation) {
      throw new Error('No canary annotation found')
    }
    const metricName = annotation.description
    if (!metricName) {
      throw new Error('Metric name must be defined')
    }

    const env = process.env['ENVIRONMENT'] || 'dev'
    const region = process.env['REGION'] || 'eu-central-1'
    if (env !== 'dev') {
      timeStart('uploadCanaryResultsToCloudWatch')
      await uploadCanaryResultsToCloudWatch(
        env,
        region,
        BASE_URL,
        metricName,
        testInfo.status === 'passed',
        testInfo.duration,
        timingRecords
      )
      timeEnd('uploadCanaryResultsToCloudWatch')
    }
  }
}

// eslint-disable-next-line func-style
const uploadCanaryResultsToCloudWatch = async (
  env: string,
  region: string,
  target: string,
  metricsPrefix: string,
  isTestPassed: boolean,
  testDurationMs: number,
  timingRecords: TimingRecords
  // eslint-disable-next-line max-params
) => {
  const cloudwatch = new CloudWatch({ region: 'eu-central-1' })
  const Dimensions = [
    {
      Name: 'Target',
      Value: target
    },
    {
      Name: 'Region',
      Value: region
    }
  ]
  const Timestamp = new Date()
  const metrics: MetricDatum[] = [
    {
      MetricName: `${metricsPrefix}.success`,
      Dimensions,
      Unit: 'Count',
      Value: isTestPassed ? 1 : 0,
      Timestamp
    },
    {
      MetricName: `${metricsPrefix}.failure`,
      Dimensions,
      Unit: 'Count',
      Value: isTestPassed ? 0 : 1,
      Timestamp
    }
  ]

  if (isTestPassed) {
    metrics.push({
      MetricName: `${metricsPrefix}.latency`,
      Dimensions,
      Unit: 'Milliseconds',
      Value: testDurationMs,
      Timestamp
    })

    for (const record of timingRecords) {
      metrics.push({
        MetricName: `${metricsPrefix}.timing.${record.item}`,
        Dimensions,
        Unit: 'Milliseconds',
        Value: record.timeMs,
        Timestamp
      })
    }
  }

  const params: PutMetricDataCommandInput = {
    MetricData: metrics,
    Namespace: `${env}_Canary_Web3Modal`
  }

  await new Promise<void>(resolve => {
    cloudwatch.putMetricData(params, (err: Error) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to upload metrics to CloudWatch', err, err.stack)
      }
      resolve()
    })
  })
}
