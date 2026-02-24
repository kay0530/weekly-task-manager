import { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';

export default function SalesforceSync() {
  const { tasks, exportData, importData } = useTaskContext();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState({
    instanceUrl: localStorage.getItem('sf-instance-url') || '',
    accessToken: localStorage.getItem('sf-access-token') || '',
  });
  const [showConfig, setShowConfig] = useState(false);

  const saveConfig = () => {
    localStorage.setItem('sf-instance-url', config.instanceUrl);
    localStorage.setItem('sf-access-token', config.accessToken);
    setShowConfig(false);
    setMessage('設定を保存しました');
  };

  const syncToSalesforce = async () => {
    if (!config.instanceUrl || !config.accessToken) {
      setMessage('Salesforce接続設定を入力してください');
      setShowConfig(true);
      return;
    }

    setStatus('syncing');
    setMessage('Salesforceに同期中...');

    try {
      for (const task of tasks) {
        const record = {
          Name: task.title || '(Untitled)',
          Member_Id__c: task.memberId,
          Category__c: task.category,
          Progress__c: task.progress,
          Done__c: task.done || '',
          Not_Done__c: task.notDone || '',
          Not_Done_Reason__c: task.notDoneReason || '',
          Issues__c: task.issues || '',
          Consultation__c: task.consultation || '',
          External_Id__c: task.id,
        };

        const response = await fetch(
          `${config.instanceUrl}/services/data/v59.0/sobjects/Weekly_Task__c/External_Id__c/${task.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(record),
          }
        );

        if (!response.ok && response.status !== 201 && response.status !== 204) {
          throw new Error(`Sync failed for task: ${task.title}`);
        }
      }

      setStatus('success');
      setMessage(`${tasks.length}件のタスクをSalesforceに同期しました`);
    } catch (err) {
      setStatus('error');
      setMessage(`同期エラー: ${err.message}`);
    }
  };

  const syncFromSalesforce = async () => {
    if (!config.instanceUrl || !config.accessToken) {
      setMessage('Salesforce接続設定を入力してください');
      setShowConfig(true);
      return;
    }

    setStatus('syncing');
    setMessage('Salesforceからデータを取得中...');

    try {
      const query = encodeURIComponent(
        'SELECT External_Id__c, Name, Member_Id__c, Category__c, Progress__c, Done__c, Not_Done__c, Not_Done_Reason__c, Issues__c, Consultation__c FROM Weekly_Task__c'
      );
      const response = await fetch(
        `${config.instanceUrl}/services/data/v59.0/query/?q=${query}`,
        {
          headers: { 'Authorization': `Bearer ${config.accessToken}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch from Salesforce');

      const data = await response.json();
      const importedTasks = data.records.map(r => ({
        id: r.External_Id__c,
        memberId: r.Member_Id__c,
        category: r.Category__c,
        title: r.Name,
        progress: r.Progress__c || 0,
        done: r.Done__c || '',
        notDone: r.Not_Done__c || '',
        notDoneReason: r.Not_Done_Reason__c || '',
        issues: r.Issues__c || '',
        consultation: r.Consultation__c || '',
        weeklyHistory: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      importData({ tasks: importedTasks });
      setStatus('success');
      setMessage(`${importedTasks.length}件のタスクをインポートしました`);
    } catch (err) {
      setStatus('error');
      setMessage(`取得エラー: ${err.message}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Salesforce連携</h3>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          {showConfig ? '閉じる' : '設定'}
        </button>
      </div>

      {showConfig && (
        <div className="mb-3 space-y-2 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-xs text-gray-600">Instance URL</label>
            <input
              type="text"
              value={config.instanceUrl}
              onChange={(e) => setConfig(p => ({ ...p, instanceUrl: e.target.value }))}
              placeholder="https://your-org.my.salesforce.com"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-0.5"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Access Token</label>
            <input
              type="password"
              value={config.accessToken}
              onChange={(e) => setConfig(p => ({ ...p, accessToken: e.target.value }))}
              placeholder="Your Salesforce access token"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-0.5"
            />
          </div>
          <button
            onClick={saveConfig}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            保存
          </button>
        </div>
      )}

      {message && (
        <div className={`text-xs mb-3 p-2 rounded ${
          status === 'error' ? 'bg-red-50 text-red-600' :
          status === 'success' ? 'bg-green-50 text-green-600' :
          'bg-blue-50 text-blue-600'
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={syncToSalesforce}
          disabled={status === 'syncing'}
          className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
        >
          {status === 'syncing' ? '同期中...' : 'SFへ送信 ↑'}
        </button>
        <button
          onClick={syncFromSalesforce}
          disabled={status === 'syncing'}
          className="flex-1 px-3 py-2 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50 cursor-pointer"
        >
          {status === 'syncing' ? '取得中...' : 'SFから取得 ↓'}
        </button>
      </div>
    </div>
  );
}
