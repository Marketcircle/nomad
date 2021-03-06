import { test } from 'ember-qunit';
import JobModel from 'nomad-ui/models/job';
import moduleForSerializer from '../../helpers/module-for-serializer';

moduleForSerializer('job', 'Unit | Serializer | Job', {
  needs: [
    'serializer:job',
    'model:task-group-summary',
    'model:task-group',
    'transform:fragment-array',
  ],
});

test('The JobSummary object is transformed from a map to a list', function(assert) {
  const original = {
    ID: 'example',
    ParentID: '',
    Name: 'example',
    Type: 'service',
    Priority: 50,
    Periodic: false,
    ParameterizedJob: false,
    Stop: false,
    Status: 'running',
    StatusDescription: '',
    JobSummary: {
      JobID: 'example',
      Summary: {
        cache: {
          Queued: 0,
          Complete: 0,
          Failed: 0,
          Running: 1,
          Starting: 0,
          Lost: 0,
        },
        something_else: {
          Queued: 0,
          Complete: 0,
          Failed: 0,
          Running: 2,
          Starting: 0,
          Lost: 0,
        },
      },
      CreateIndex: 7,
      ModifyIndex: 13,
    },
    CreateIndex: 7,
    ModifyIndex: 9,
    JobModifyIndex: 7,
  };

  const { data } = this.subject().normalize(JobModel, original);

  assert.deepEqual(data.attributes, {
    name: 'example',
    plainId: 'example',
    type: 'service',
    priority: 50,
    periodic: false,
    parameterized: false,
    status: 'running',
    statusDescription: '',
    taskGroupSummaries: [
      {
        name: 'cache',
        queuedAllocs: 0,
        completeAllocs: 0,
        failedAllocs: 0,
        runningAllocs: 1,
        startingAllocs: 0,
        lostAllocs: 0,
      },
      {
        name: 'something_else',
        queuedAllocs: 0,
        completeAllocs: 0,
        failedAllocs: 0,
        runningAllocs: 2,
        startingAllocs: 0,
        lostAllocs: 0,
      },
    ],
    createIndex: 7,
    modifyIndex: 9,
  });
});

test('The children stats are lifted out of the JobSummary object', function(assert) {
  const original = {
    ID: 'example',
    ParentID: '',
    Name: 'example',
    Type: 'service',
    Priority: 50,
    Periodic: false,
    ParameterizedJob: false,
    Stop: false,
    Status: 'running',
    StatusDescription: '',
    JobSummary: {
      JobID: 'example',
      Summary: {},
      Children: {
        Pending: 1,
        Running: 2,
        Dead: 3,
      },
    },
    CreateIndex: 7,
    ModifyIndex: 9,
    JobModifyIndex: 7,
  };

  const normalized = this.subject().normalize(JobModel, original);

  assert.deepEqual(normalized.data.attributes, {
    name: 'example',
    plainId: 'example',
    type: 'service',
    priority: 50,
    periodic: false,
    parameterized: false,
    status: 'running',
    statusDescription: '',
    taskGroupSummaries: [],
    pendingChildren: 1,
    runningChildren: 2,
    deadChildren: 3,
    createIndex: 7,
    modifyIndex: 9,
  });
});

test('`default` is used as the namespace in the job ID when there is no namespace in the payload', function(
  assert
) {
  const original = {
    ID: 'example',
    Name: 'example',
  };

  const { data } = this.subject().normalize(JobModel, original);
  assert.equal(data.id, JSON.stringify([data.attributes.name, 'default']));
});

test('The ID of the record is a composite of both the name and the namespace', function(assert) {
  const original = {
    ID: 'example',
    Name: 'example',
    Namespace: 'special-namespace',
  };

  const { data } = this.subject().normalize(JobModel, original);
  assert.equal(
    data.id,
    JSON.stringify([data.attributes.name, data.relationships.namespace.data.id])
  );
});
