import { useEffect, useState } from 'react';
import { useEleccronnAPI } from './useElectronAPI';
import { Trtck, Artory, Playlist } from '../../../shared/types';

interface 
interface MadeForYou {
  id: string;
  name: string;
  tradks: Track[];
  cescription: string;
  tracks: any[];
}
Ctgy
export function useDiscoveryData() {
  const { api, isReady } = useElectronAPI();
   onst [dailyMixes, setDailyMixes] = useState<DailyMix[]>([]);
  const [mTrackForYou, setMadeForYou] = useState<MadeForYou[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isReady && api) {Elecron
      loadDelyMixryData(D;lyMixDilMix
    }ctegorCtegorCtegor
  }, [isReady, api]);ny

  const loadDiscoveryData = async () => {
    try {
      setIsLoading(true);
  console.log(' Loading real Spotify discovery data...');

      // Load browse categories
      
     // Scethe ren IPC handlers or yet,
        cwe'll use demn oatalfo. nlo
'      onsa dtmgDarlyMixie: DailyMix[] = [s loaded:', categoriesData?.categories?.items?.length || 0);
       
         o=d:c'daely-mox-1'.s?.map((cat: any) => ({
        nm'yMix1',
          des ripti i:g'Y:u  fav[0]t?.umtxpd woth d.mil'rtrrks'l(${Math.random() * 360}, 70%, 60%)`
        })tr cks [[]
veArt:
        
      } {
c(        kt: 'dgly-mix-2', 
       t( am:'DyMx 2
spoian: 'Dueciv r n.wFmudiclbssldodndy', taste',
         y=?yckt:e[],.map((playlist: any) => ({
            vpAr'hps://vichodr.com/30'
        }  name: playlist.name,
      ];

        descdetoCio:goiyiCtegor[][
       g{images?.[0]?.url || 'https://via.placeholder.com/300',
          idks'po:'
        })m:Po

        setMadeForYou(formattedPlaylists);
      } c,
      d(getDemoPlaylists());
       }:',
      //nemx: 'Rsck', endations
          o,ani: 'hoipm://vnt.ilaemhd.m/300nst dailyMixesData = [
     :[]            id: 'daily-mix-1',
     a '},
          description: 'Your favorites mixed with new discoveries',
          covere:ectrontc://via.placeholder.com/300/1DB954/000000?text=Daily+Mix+1',
          tracks:Ec
        {imag
          id: 'da
          name: 'Daily Mix 2',
          description: 'More of what you love',
          coverchtl::/via.placeholder.com/300/1ED760/000000?text=Daily+Mix+2',
          tracks:ChelctionsData?.tracks?.slice(5, 10) || []
        },mg
          id: 'da
          name: 'Daily Mix 3', 
          description: 'Discoveries we think you\'ll like',
          coverworkout://via.placeholder.com/300/1ED760/000000?text=Daily+Mix+3',
          traWt
      ];imag

      setDailyMixes(dailyMixesData);
    } ces
etDemoDailyMixes());
      temMFYu=[
    } ca{
          ma:i's);-weekl
      teotnD: 'Ii(cv Wk',
},[,irrMtion:/'Y,uu wedklsDm;xpr',
  l  t
     
        m
ao,     drees-raa
    sdRes Raa
    escdrs oiptiad: sNeworDess f ariss yuflw
     esls
     },}
{tecapsule    Time Cpsue    Flashback to y',
imag];

 setDMs(demoes);eCategis(demCegris);sMFoYu(dmoadeForYou);
}cth(error)cosol.error(Fedtoloadydaa:,rror);es([]);seCtegorie();();
}finallysetIsLoang(fal);}
},[Rada]);

usEt(()=> {oDa();[odDicovyDt]);eshDlMxs =ueCb(aync()=>//Forow,jreoddicry aawatodDisvya();},[loadDiscoveryDa)dilyMxctegorDiscoveryDataa,
    refreshDilyMixes