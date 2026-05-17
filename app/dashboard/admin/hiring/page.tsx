import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { HiringKanban } from '@/components/admin/HiringKanban'
import { Plus } from 'lucide-react'
import { AddJobButton } from '@/components/admin/AddJobButton'

export default async function HiringPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const [{ data: jobs }, { data: applications }] = await Promise.all([
    supabase.from('job_postings').select('*').eq('agency_id', profile!.agency_id).order('created_at', { ascending: false }),
    supabase.from('applications').select('*, job:job_postings(title)').eq('agency_id', profile!.agency_id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-8">
      <PageHeader
        title="Hiring"
        subtitle={`${jobs?.filter(j => j.status === 'open').length || 0} open positions`}
        action={<AddJobButton agencyId={profile!.agency_id} />}
      />

      {/* Job Postings */}
      {jobs && jobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Job Postings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  {job.certification_required && <p>Cert: {job.certification_required}</p>}
                  {job.pay_rate && <p>Pay: ${job.pay_rate}/hr</p>}
                  {job.employment_type && <p>{job.employment_type}</p>}
                </div>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  {applications?.filter(a => a.job_id === job.id).length || 0} applicants
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Applicant Pipeline</h2>
      <HiringKanban applications={applications || []} />
    </div>
  )
}
