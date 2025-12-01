import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2Icon, SparkleIcon } from 'lucide-react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';

function AddNewCourseDialog({ children }) {
  const [loading, setLoading]=useState(false);

  const [formData, setFormDta] = useState({
    name: '',
    description: '',
    includeVideo: false,
    noOfChapters: 1,
    category: '',
    level: ''
  });

  const handleInputChange = (field,value) => {
    setFormDta(prev => ({
      ...prev,
      [field]: value
    }));
    console.log(formData);
  }

  const onGenerate = async () => {
    console.log(formData);
    const courseId = uuidv4(); 
    try {
        setLoading(true);
        const result = await axios.post('/api/generate-courses-layout', {
          ...formData,
          courseId:courseId
        });
        console.log(result.data);
        setLoading(false);
    }
    catch (e) 
    {
      setLoading(false);
      console.log(e);
    }
}

  return (
    <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription asChild>
               <div className='flex flex-col gap-3 mt-3'>
                    <div>
                        <label className='text-sm font-semibold'>Course Name</label>
                        <input type='text' className='w-full p-2 border rounded-md mt-1' placeholder='Enter course name' onChange={(event)=>handleInputChange('courseName', event?.target.value)}/>
                    </div>

                    <div>
                        <label className='text-sm font-semibold'>Course Description (optional)</label>
                        <textarea className='w-full p-2 border rounded-md mt-1' placeholder='Enter course description' rows={4} onChange={(event)=>handleInputChange('courseDescription', event?.target.value)}></textarea>
                    </div>
                    
                    <div>
                        <label className='text-sm font-semibold'>No. Of chapters</label>
                        <input type='number' className='w-full p-2 border rounded-md mt-1' placeholder='No of chapters' onChange={(event)=>handleInputChange('noOfChapters', event?.target.value)}/>
                    </div>
                    <div className='flex items-center gap-2'>
                    <label>Include Video</label>
                      <Switch 
                         onCheckedChange={()=>handleInputChange('includeVideo',!formData?.includeVideo)}/>
                    </div>
                        <div>
                            <label className=''>Difficulty Level</label>
                            <Select onValueChange={(value)=>handleInputChange('Level',value)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Difficult Level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="moderate">Moderate</SelectItem>
                                  <SelectItem value="advvanced">Advanced</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                      <div>
                        <label className='text-sm font-semibold'>Category</label>
                        <input  className='w-full p-2 border rounded-md mt-1' placeholder='Category' onChange={(event) => handleInputChange('Category', event?.target.value)}/>
                    </div>
                    <div className=''>
                      <Button className={'w-full'} onClick={onGenerate} disabled={loading}> 
                        {loading?<Loader2Icon className='animate-spin'/>:
                        <SparkleIcon/> } Generate Course</Button>
                    </div>
                      
                    </div>
              </DialogDescription>
            </DialogHeader>
        </DialogContent>
    </Dialog>
  )
}

export default AddNewCourseDialog
